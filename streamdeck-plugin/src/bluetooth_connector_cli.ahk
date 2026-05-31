#Requires AutoHotkey v2.0
#SingleInstance Force

TraySetIcon("C:\WINDOWS\system32\netshell.dll", 104) ; Set the tray icon to a network-related icon from system resources

; Get device name from command line argument, or use default
deviceName := A_Args.Length > 0 ? A_Args[1] : "AirPods Pro"

; Get action from second argument: "connect" (default) or "disconnect"
action := A_Args.Length > 1 ? A_Args[2] : "connect"

; Dynamically loads the Bluetooth Control Panel library to use its functions
DllCall("LoadLibrary", "str", "Bthprops.cpl", "ptr")

; Desired service state (1 = connect/enable, 0 = disconnect/disable)
toggleOn := (action = "connect") ? 1 : 0

; Set maximum retry attempts to prevent infinite loops
maxRetries := 10

; Calculate structure size based on pointer size
structSize := 24 + A_PtrSize * 2

; Initialize the structure for Bluetooth device search parameters
BLUETOOTH_DEVICE_SEARCH_PARAMS := Buffer(structSize, 0)
NumPut("uint", structSize, BLUETOOTH_DEVICE_SEARCH_PARAMS, 0) ; Set the size of the structure
NumPut("uint", 1, BLUETOOTH_DEVICE_SEARCH_PARAMS, 4) ; fReturnAuthenticated: return paired devices

; Initialize the structure to hold information about a Bluetooth device
BLUETOOTH_DEVICE_INFO := Buffer(560, 0)
NumPut("uint", 560, BLUETOOTH_DEVICE_INFO, 0) ; Set the size of the structure

; Loop through all found Bluetooth devices to find and (dis)connect the specified device
loop
{
    ; On the first iteration, use BluetoothFindFirstDevice to start the search
    if (A_Index = 1)
    {
        foundDevice := DllCall("Bthprops.cpl\BluetoothFindFirstDevice", "ptr", BLUETOOTH_DEVICE_SEARCH_PARAMS, "ptr", BLUETOOTH_DEVICE_INFO, "ptr")
        if !foundDevice
        {
            FileAppend("ERROR: No bluetooth devices found`n", "*")
            ExitApp(1)
        }
    }
    else
    {
        ; On subsequent iterations, use BluetoothFindNextDevice to continue the search
        if !DllCall("Bthprops.cpl\BluetoothFindNextDevice", "ptr", foundDevice, "ptr", BLUETOOTH_DEVICE_INFO)
        {
            FileAppend("ERROR: Target Bluetooth device '" . deviceName . "' not found`n", "*")
            ExitApp(2)
        }
    }

    ; Check if the current device is the target device by comparing its name
    if (InStr(StrGet(BLUETOOTH_DEVICE_INFO.Ptr + 64, "UTF-16"), deviceName))
    {
        deviceNameActual := StrGet(BLUETOOTH_DEVICE_INFO.Ptr + 64, "UTF-16") ; Retrieve the actual name of the device

        ; Handsfree (HFP): voice communication. Present on headsets/earbuds, absent on speakers.
        hfStatus := ToggleBluetoothService(BLUETOOTH_DEVICE_INFO, "{0000111e-0000-1000-8000-00805f9b34fb}", toggleOn, maxRetries)

        ; AudioSink (A2DP): music streaming. Present on virtually all audio output devices.
        asStatus := ToggleBluetoothService(BLUETOOTH_DEVICE_INFO, "{0000110b-0000-1000-8000-00805f9b34fb}", toggleOn, maxRetries)

        ; Consider the operation successful if AT LEAST ONE audio profile was toggled.
        ; This supports speaker-only devices (e.g. Echo Dot, Bluetooth speakers) that expose
        ; only AudioSink, as well as headsets/earbuds that expose both profiles.
        if (hfStatus = "ok" || asStatus = "ok")
        {
            successMsg := (action = "connect") ? "connected" : "disconnected"
            FileAppend("SUCCESS: Bluetooth device '" . deviceNameActual . "' " . successMsg . "`n", "*")
            ExitApp(0)
        }

        ; Neither profile could be toggled.
        FileAppend("ERROR: Failed to " . action . " '" . deviceNameActual . "' (Handsfree: " . hfStatus . ", AudioSink: " . asStatus . ")`n", "*")
        ExitApp(3)
    }
}

; Toggle a single Bluetooth service to the desired state.
; Returns: "ok" (reached desired state), "absent" (device lacks this profile),
;          or "fail" (retries exhausted without success).
ToggleBluetoothService(deviceInfo, serviceGuidStr, toggleOn, maxRetries)
{
    ; Convert the service class GUID string into a binary CLSID
    serviceGuid := Buffer(16)
    DllCall("ole32\CLSIDFromString", "wstr", serviceGuidStr, "ptr", serviceGuid)

    toggle := toggleOn
    retryCount := 0
    loop
    {
        hr := DllCall("Bthprops.cpl\BluetoothSetServiceState", "ptr", 0, "ptr", deviceInfo, "ptr", serviceGuid, "int", toggle)

        if (hr = 0) ; Operation succeeded
        {
            if (toggle = toggleOn)
                return "ok" ; Reached the desired state
            toggle := !toggle ; Reached intermediate state, flip toward the desired one
        }
        else if (hr = 87) ; ERROR_INVALID_PARAMETER: known quirk, flip the state and retry
            toggle := !toggle
        else if (hr = 1060) ; ERROR_SERVICE_DOES_NOT_EXIST: device does not expose this profile
            return "absent"

        retryCount++
        if (retryCount >= maxRetries)
            return "fail"
    }
}
