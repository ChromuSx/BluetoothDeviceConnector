Menu, Tray, Icon, C:\WINDOWS\system32\netshell.dll, 104 ; Set the tray icon to a network-related icon from system resources

deviceName := "AirPods Pro" ; Define the name of the Bluetooth device to connect to

; Dynamically loads the Bluetooth Control Panel library to use its functions
DllCall("LoadLibrary", "str", "Bthprops.cpl", "ptr")

; Initialize the toggle state variable and set it to 1 to represent an enabled state
toggle := toggleOn := 1

; Initialize the structure for Bluetooth device search parameters with appropriate size and default values
VarSetCapacity(BLUETOOTH_DEVICE_SEARCH_PARAMS, 24+A_PtrSize*2, 0)
NumPut(24+A_PtrSize*2, BLUETOOTH_DEVICE_SEARCH_PARAMS, 0, "uint") ; Set the size of the structure
NumPut(1, BLUETOOTH_DEVICE_SEARCH_PARAMS, 4, "uint") ; Set the search to return authenticated devices

; Initialize the structure to hold information about a Bluetooth device with appropriate size
VarSetCapacity(BLUETOOTH_DEVICE_INFO, 560, 0)
NumPut(560, BLUETOOTH_DEVICE_INFO, 0, "uint") ; Set the size of the structure

; Loop through all found Bluetooth devices to find and connect to the specified device
loop
{
    ; On the first iteration, use BluetoothFindFirstDevice to start the search
    If (A_Index = 1)
    {
        foundDevice := DllCall("Bthprops.cpl\BluetoothFindFirstDevice", "ptr", &BLUETOOTH_DEVICE_SEARCH_PARAMS, "ptr", &BLUETOOTH_DEVICE_INFO, "ptr")
        if !foundDevice
        {
            msgbox, No bluetooth devices found ; Display message if no Bluetooth devices are found
            return
        }
    }
    else
    {
        ; On subsequent iterations, use BluetoothFindNextDevice to continue the search
        if !DllCall("Bthprops.cpl\BluetoothFindNextDevice", "ptr", foundDevice, "ptr", &BLUETOOTH_DEVICE_INFO)
        {
            msgbox, Target Bluetooth device not found ; Display message if the specific device is not found
            break
        }
    }
    ; Check if the current device is the target device by comparing its name
    if (InStr(StrGet(&BLUETOOTH_DEVICE_INFO+64), deviceName))
    {
        deviceNameActual := StrGet(&BLUETOOTH_DEVICE_INFO+64) ; Retrieve the actual name of the device
        
        ; Prepare the Handsfree service class ID for enabling/disabling the service
        VarSetCapacity(Handsfree, 16)
        DllCall("ole32\CLSIDFromString", "wstr", "{0000111e-0000-1000-8000-00805f9b34fb}", "ptr", &Handsfree)
        
        ; Prepare the AudioSink service class ID for enabling/disabling the service
        VarSetCapacity(AudioSink, 16)
        DllCall("ole32\CLSIDFromString", "wstr", "{0000110b-0000-1000-8000-00805f9b34fb}", "ptr", &AudioSink)
        
        ; Toggle the Handsfree service state for voice communication
        loop
        {
            hr := DllCall("Bthprops.cpl\BluetoothSetServiceState", "ptr", 0, "ptr", &BLUETOOTH_DEVICE_INFO, "ptr", &Handsfree, "int", toggle)
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
            hr := DllCall("Bthprops.cpl\BluetoothSetServiceState", "ptr", 0, "ptr", &BLUETOOTH_DEVICE_INFO, "ptr", &AudioSink, "int", toggle)
            if (hr = 0) ; If the operation was successful
            {
                if (toggle = toggleOn)
                {
                    msgBox, Bluetooth device %deviceNameActual% connected ; Notify the user that the device has been connected
                    break 2 ; Exit both loops
                }
                toggle := !toggle ; Toggle the state for the next attempt
            }
            if (hr = 87) ; Error code 87 indicates a parameter error, so toggle the state and retry
                toggle := !toggle
        }
    }
}

