#Requires AutoHotkey v2.0
#SingleInstance Force
#NoTrayIcon ; Background helper invoked by the plugin; no tray icon (avoids tray flicker on status checks)

; Arguments: 1 = device name, 2 = action (connect | disconnect | status | list),
;            3 = audio profile (a2dp | a2dp-hfp, optional; default a2dp-hfp)
deviceName := A_Args.Length > 0 ? A_Args[1] : "AirPods Pro"
action := A_Args.Length > 1 ? A_Args[2] : "connect"
audioProfile := A_Args.Length > 2 ? StrLower(A_Args[3]) : "a2dp-hfp"

if (action != "connect" && action != "disconnect" && action != "status" && action != "list")
{
    WriteOutput("ERROR: Usage: BluetoothConnector.exe <device name|-> <list|status|connect|disconnect> [a2dp|a2dp-hfp]`n")
    ExitApp(64)
}

if (action != "list" && audioProfile != "a2dp" && audioProfile != "a2dp-hfp")
{
    WriteOutput("ERROR: Unknown audio profile '" . audioProfile . "'. Expected a2dp or a2dp-hfp.`n")
    ExitApp(64)
}

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
        WriteOutput("ERROR: Target Bluetooth device '" . deviceName . "' not found`n")
        ExitApp(2)
    }
    WriteOutput((state ? "CONNECTED" : "DISCONNECTED") . "`n")
    ExitApp(0)
}

device := FindDeviceByName(deviceName)
if (!device)
{
    WriteOutput("ERROR: Target Bluetooth device '" . deviceName . "' not found`n")
    ExitApp(2)
}

deviceNameActual := StrGet(device.Ptr + 64, "UTF-16") ; Retrieve the actual name of the device

if (action = "connect")
{
    ; Stereo-only mode explicitly disables HFP so a microphone left active by
    ; Windows or an older plugin version cannot force low-quality call audio.
    hfToggleOn := (audioProfile = "a2dp-hfp") ? 1 : 0
    hfStatus := ToggleBluetoothService(device, "{0000111e-0000-1000-8000-00805f9b34fb}", hfToggleOn, maxRetries)
    asStatus := ToggleBluetoothService(device, "{0000110b-0000-1000-8000-00805f9b34fb}", 1, maxRetries)
}
else
{
    ; Disconnect always disables both audio services so HFP cannot keep the
    ; device connected after an A2DP-only session.
    hfStatus := ToggleBluetoothService(device, "{0000111e-0000-1000-8000-00805f9b34fb}", 0, maxRetries)
    asStatus := ToggleBluetoothService(device, "{0000110b-0000-1000-8000-00805f9b34fb}", 0, maxRetries)
}

if (IsSuccessfulOperation(action, audioProfile, hfStatus, asStatus))
{
    successMsg := (action = "connect") ? "connected" : "disconnected"
    WriteOutput("SUCCESS: Bluetooth device '" . deviceNameActual . "' " . successMsg . " (profile: " . audioProfile . ")`n")
    ExitApp(0)
}

WriteOutput("ERROR: Failed to " . action . " '" . deviceNameActual . "' (profile: " . audioProfile . ", Handsfree: " . hfStatus . ", AudioSink: " . asStatus . ")`n")
ExitApp(3)


; =====================================================================
;  Helper functions
; =====================================================================

; Stream Deck launches the helper with piped stdout, but a manual launch may
; have no standard-output handle. Ignore that write failure so invalid CLI
; arguments still return their intended exit code instead of showing a dialog.
WriteOutput(message)
{
    try
    {
        FileAppend(message, "*")
    }
    catch
    {
    }
}

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
        WriteOutput(name . "`n")
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

; Return 1 if the named device has a device-wide Bluetooth connection,
; 0 if disconnected, or -1 if not found. The plugin treats this as ambiguous
; for A2DP-only keys because it does not prove that the audio endpoint is active.
GetDeviceConnectionState(targetName)
{
    device := FindDeviceByName(targetName)
    if (!device)
        return -1
    return NumGet(device, 20, "int") ? 1 : 0 ; fConnected offset in BLUETOOTH_DEVICE_INFO
}

; Stereo-only success requires A2DP. For combined connects and all disconnects,
; every exposed service must reach the requested state; a missing profile is
; allowed so speaker-only and microphone-only devices remain supported.
IsSuccessfulOperation(action, audioProfile, hfStatus, asStatus)
{
    if (action = "connect" && audioProfile = "a2dp")
        return (asStatus = "ok" && (hfStatus = "ok" || hfStatus = "absent"))

    allExposedSucceeded := (hfStatus = "ok" || hfStatus = "absent")
        && (asStatus = "ok" || asStatus = "absent")
    atLeastOneProfileExists := (hfStatus = "ok" || asStatus = "ok")
    return (allExposedSucceeded && atLeastOneProfileExists)
}

; Toggle a single Bluetooth service to the desired state.
; Returns: "ok" (reached desired state), "absent" (device lacks this profile),
;          or "fail:0x..." (the Windows API rejected the transition).
ToggleBluetoothService(deviceInfo, serviceGuidStr, toggleOn, maxRetries)
{
    ; Convert the service class GUID string into a binary CLSID
    serviceGuid := Buffer(16)
    DllCall("ole32\CLSIDFromString", "wstr", serviceGuidStr, "ptr", serviceGuid)

    toggle := toggleOn
    retryCount := 0
    lastHr := 0
    loop
    {
        hr := DllCall("Bthprops.cpl\BluetoothSetServiceState", "ptr", 0, "ptr", deviceInfo, "ptr", serviceGuid, "int", toggle, "uint")
        lastHr := hr

        if (hr = 0) ; Operation succeeded
        {
            if (toggle = toggleOn)
                return "ok" ; Reached the desired state
            toggle := !toggle ; Reached intermediate state, flip toward the desired one
        }
        else if (hr = 87 || hr = 0x80070057) ; Already in state (raw Windows behavior or documented HRESULT)
        {
            if (toggle = toggleOn && toggleOn = 0)
                return "ok" ; Already disabled: do not briefly re-enable the service.
            toggle := !toggle ; Continue toward the target, cycling enabled profiles to reconnect.
        }
        else if (hr = 1060) ; ERROR_SERVICE_DOES_NOT_EXIST: device does not expose this profile
            return "absent"
        else if (hr = 1168 && toggleOn = 0 && StrLower(serviceGuidStr) = "{0000111e-0000-1000-8000-00805f9b34fb}")
            return "absent" ; AirPods/Windows compatibility: unavailable HFP while disabling it.
        retryCount++
        if (retryCount >= maxRetries)
            return "fail:0x" . Format("{:08X}", lastHr)
    }
}
