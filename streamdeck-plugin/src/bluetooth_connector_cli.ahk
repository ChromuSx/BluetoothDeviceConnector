#Requires AutoHotkey v2.0
#SingleInstance Force
#NoTrayIcon ; Background helper invoked by the plugin; no tray icon (avoids tray flicker on status checks)

; Arguments: 1 = device name, 2 = action (connect | disconnect | status | list)
deviceName := A_Args.Length > 0 ? A_Args[1] : "AirPods Pro"
action := A_Args.Length > 1 ? A_Args[2] : "connect"

; Dynamically loads the Bluetooth Control Panel library to use its functions
DllCall("LoadLibrary", "str", "Bthprops.cpl", "ptr")

maxRetries := 10 ; Maximum retry attempts to prevent infinite loops

; ---- "list": print the name of every paired device, one per line ----
if (action = "list")
{
    EnumeratePairedDevices(ListCallback)
    ExitApp(0)
}

; ---- "status": report whether the target device is currently connected ----
if (action = "status")
{
    state := GetDeviceConnectionState(deviceName)
    if (state = -1)
    {
        FileAppend("ERROR: Target Bluetooth device '" . deviceName . "' not found`n", "*")
        ExitApp(2)
    }
    FileAppend((state ? "CONNECTED" : "DISCONNECTED") . "`n", "*")
    ExitApp(0)
}

; ---- "connect" / "disconnect": toggle the audio services ----
toggleOn := (action = "connect") ? 1 : 0

device := FindDeviceByName(deviceName)
if (!device)
{
    FileAppend("ERROR: Target Bluetooth device '" . deviceName . "' not found`n", "*")
    ExitApp(2)
}

deviceNameActual := StrGet(device.Ptr + 64, "UTF-16") ; Retrieve the actual name of the device

; Handsfree (HFP): voice communication. Present on headsets/earbuds, absent on speakers.
hfStatus := ToggleBluetoothService(device, "{0000111e-0000-1000-8000-00805f9b34fb}", toggleOn, maxRetries)

; AudioSink (A2DP): music streaming. Present on virtually all audio output devices.
asStatus := ToggleBluetoothService(device, "{0000110b-0000-1000-8000-00805f9b34fb}", toggleOn, maxRetries)

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


; =====================================================================
;  Helper functions
; =====================================================================

; Build a search-params buffer that returns paired (authenticated) devices.
MakeSearchParams()
{
    structSize := 24 + A_PtrSize * 2
    sp := Buffer(structSize, 0)
    NumPut("uint", structSize, sp, 0) ; dwSize
    NumPut("uint", 1, sp, 4)          ; fReturnAuthenticated: return paired devices
    return sp
}

; Iterate over every paired device, invoking callback(deviceInfoBuffer) for each.
EnumeratePairedDevices(callback)
{
    sp := MakeSearchParams()
    di := Buffer(560, 0)
    NumPut("uint", 560, di, 0)

    foundDevice := DllCall("Bthprops.cpl\BluetoothFindFirstDevice", "ptr", sp, "ptr", di, "ptr")
    if !foundDevice
        return
    loop
    {
        callback(di)
        if !DllCall("Bthprops.cpl\BluetoothFindNextDevice", "ptr", foundDevice, "ptr", di)
            break
    }
    DllCall("Bthprops.cpl\BluetoothFindDeviceClose", "ptr", foundDevice)
}

; Callback for "list": print each device name on its own line.
ListCallback(di)
{
    name := StrGet(di.Ptr + 64, "UTF-16")
    if (name != "")
        FileAppend(name . "`n", "*")
}

; Return the BLUETOOTH_DEVICE_INFO buffer for the first device whose name contains
; targetName, or 0 if none match.
FindDeviceByName(targetName)
{
    sp := MakeSearchParams()
    di := Buffer(560, 0)
    NumPut("uint", 560, di, 0)

    foundDevice := DllCall("Bthprops.cpl\BluetoothFindFirstDevice", "ptr", sp, "ptr", di, "ptr")
    if !foundDevice
        return 0
    match := 0
    loop
    {
        if (InStr(StrGet(di.Ptr + 64, "UTF-16"), targetName))
        {
            match := di
            break
        }
        if !DllCall("Bthprops.cpl\BluetoothFindNextDevice", "ptr", foundDevice, "ptr", di)
            break
    }
    DllCall("Bthprops.cpl\BluetoothFindDeviceClose", "ptr", foundDevice)
    return match
}

; Return 1 if the named device is connected, 0 if disconnected, -1 if not found.
GetDeviceConnectionState(targetName)
{
    device := FindDeviceByName(targetName)
    if (!device)
        return -1
    return NumGet(device, 20, "int") ? 1 : 0 ; fConnected is at offset 20 of BLUETOOTH_DEVICE_INFO
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
