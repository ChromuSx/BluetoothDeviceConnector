#Requires AutoHotkey v2.0

TraySetIcon("C:\WINDOWS\system32\netshell.dll", 104) ; Set the tray icon to a network-related icon from system resources

; Get device name from command line argument, or use default
deviceName := A_Args.Length > 0 ? A_Args[1] : "AirPods Pro"

; Get action from second argument: "connect" (default) or "disconnect"
action := A_Args.Length > 1 ? A_Args[2] : "connect"

; Dynamically loads the Bluetooth Control Panel library to use its functions
DllCall("LoadLibrary", "str", "Bthprops.cpl", "ptr")

; Initialize the toggle state variable based on action (1 = connect, 0 = disconnect)
toggle := toggleOn := (action = "connect") ? 1 : 0

; Calculate structure size based on pointer size
structSize := 24 + A_PtrSize * 2

; Initialize the structure for Bluetooth device search parameters with appropriate size and default values
BLUETOOTH_DEVICE_SEARCH_PARAMS := Buffer(structSize, 0)
NumPut("uint", structSize, BLUETOOTH_DEVICE_SEARCH_PARAMS, 0) ; Set the size of the structure
NumPut("uint", 1, BLUETOOTH_DEVICE_SEARCH_PARAMS, 4) ; Set the search to return authenticated devices

; Initialize the structure to hold information about a Bluetooth device with appropriate size
BLUETOOTH_DEVICE_INFO := Buffer(560, 0)
NumPut("uint", 560, BLUETOOTH_DEVICE_INFO, 0) ; Set the size of the structure

; Loop through all found Bluetooth devices to find and connect to the specified device
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

        ; Prepare the Handsfree service class ID for enabling/disabling the service
        Handsfree := Buffer(16)
        DllCall("ole32\CLSIDFromString", "wstr", "{0000111e-0000-1000-8000-00805f9b34fb}", "ptr", Handsfree)

        ; Prepare the AudioSink service class ID for enabling/disabling the service
        AudioSink := Buffer(16)
        DllCall("ole32\CLSIDFromString", "wstr", "{0000110b-0000-1000-8000-00805f9b34fb}", "ptr", AudioSink)

        ; Toggle the Handsfree service state for voice communication
        loop
        {
            hr := DllCall("Bthprops.cpl\BluetoothSetServiceState", "ptr", 0, "ptr", BLUETOOTH_DEVICE_INFO, "ptr", Handsfree, "int", toggle)
            if (hr = 0) ; If the operation was successful
            {
                if (toggle = toggleOn)
                    break ; Exit the loop if the service has been successfully toggled
                toggle := !toggle ; Toggle the state for the next attempt
            }
            if (hr = 87) ; Error code 87 indicates a parameter error, so toggle the state and retry
                toggle := !toggle
        }

        ; Toggle the AudioSink service state for music streaming
        loop
        {
            hr := DllCall("Bthprops.cpl\BluetoothSetServiceState", "ptr", 0, "ptr", BLUETOOTH_DEVICE_INFO, "ptr", AudioSink, "int", toggle)
            if (hr = 0) ; If the operation was successful
            {
                if (toggle = toggleOn)
                {
                    successMsg := (action = "connect") ? "connected" : "disconnected"
                    FileAppend("SUCCESS: Bluetooth device '" . deviceNameActual . "' " . successMsg . "`n", "*")
                    ExitApp(0)
                }
                toggle := !toggle ; Toggle the state for the next attempt
            }
            if (hr = 87) ; Error code 87 indicates a parameter error, so toggle the state and retry
                toggle := !toggle
        }
    }
}
