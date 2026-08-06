#Requires AutoHotkey v2.0
#SingleInstance Force

TraySetIcon("C:\WINDOWS\system32\netshell.dll", 104)

; =====================================================================
;  Configuration
; =====================================================================
; These defaults are used when the script is launched without arguments.
; audioProfile: "a2dp" keeps stereo playback only and disables Hands-Free.
;               "a2dp-hfp" enables stereo playback plus the microphone.
deviceName := "AirPods Pro"
action := "connect"
audioProfile := "a2dp-hfp"

; Optional command line:
; AutoHotkey64.exe bluetooth_device_connector.ahk "Device name" [connect|disconnect] [a2dp|a2dp-hfp]
if (A_Args.Length > 0)
    deviceName := A_Args[1]
if (A_Args.Length > 1)
    action := A_Args[2]
if (A_Args.Length > 2)
    audioProfile := A_Args[3]

action := StrLower(action)
audioProfile := StrLower(audioProfile)

if (Trim(deviceName) = "")
{
    MsgBox("Set deviceName to the name of a paired Bluetooth device.", "Bluetooth Device Connector", "Iconx")
    ExitApp(64)
}

if (action != "connect" && action != "disconnect")
{
    MsgBox("Unknown action '" . action . "'. Expected connect or disconnect.", "Bluetooth Device Connector", "Iconx")
    ExitApp(64)
}

if (audioProfile != "a2dp" && audioProfile != "a2dp-hfp")
{
    MsgBox("Unknown audio profile '" . audioProfile . "'. Expected a2dp or a2dp-hfp.", "Bluetooth Device Connector", "Iconx")
    ExitApp(64)
}

; Load the Windows Bluetooth Control Panel API used to manage audio services.
DllCall("LoadLibrary", "str", "Bthprops.cpl", "ptr")

maxRetries := 10
device := FindDeviceByName(deviceName)
if (!device)
{
    MsgBox("Target Bluetooth device '" . deviceName . "' not found. Pair it in Windows first and verify its name.", "Bluetooth Device Connector", "Iconx")
    ExitApp(2)
}

deviceNameActual := StrGet(device.Ptr + 64, "UTF-16")

if (action = "connect")
{
    ; Stereo-only mode explicitly disables HFP before enabling A2DP, preventing
    ; Windows from switching playback to the low-quality call profile.
    hfToggleOn := (audioProfile = "a2dp-hfp") ? 1 : 0
    hfStatus := ToggleBluetoothService(device, "{0000111e-0000-1000-8000-00805f9b34fb}", hfToggleOn, maxRetries)
    asStatus := ToggleBluetoothService(device, "{0000110b-0000-1000-8000-00805f9b34fb}", 1, maxRetries)
}
else
{
    ; Disconnect both services so HFP cannot keep the device connected after
    ; a stereo-only session.
    hfStatus := ToggleBluetoothService(device, "{0000111e-0000-1000-8000-00805f9b34fb}", 0, maxRetries)
    asStatus := ToggleBluetoothService(device, "{0000110b-0000-1000-8000-00805f9b34fb}", 0, maxRetries)
}

if (IsSuccessfulOperation(action, audioProfile, hfStatus, asStatus))
{
    operationLabel := (action = "connect") ? "connected" : "disconnected"
    profileDetails := (action = "connect") ? "`nProfile: " . AudioProfileLabel(audioProfile) : ""
    MsgBox("Bluetooth device '" . deviceNameActual . "' " . operationLabel . "." . profileDetails, "Bluetooth Device Connector", "Iconi")
    ExitApp(0)
}

MsgBox("Failed to " . action . " '" . deviceNameActual . "'.`nHands-Free: " . hfStatus . "`nAudioSink: " . asStatus, "Bluetooth Device Connector", "Iconx")
ExitApp(3)


; =====================================================================
;  Helper functions
; =====================================================================

AudioProfileLabel(audioProfile)
{
    return (audioProfile = "a2dp") ? "Stereo only (A2DP)" : "Stereo + microphone (A2DP + Hands-Free)"
}

; Build search parameters that enumerate paired (authenticated) devices.
MakeSearchParams()
{
    structSize := 24 + A_PtrSize * 2
    searchParams := Buffer(structSize, 0)
    NumPut("uint", structSize, searchParams, 0)
    NumPut("uint", 1, searchParams, 4)
    return searchParams
}

; Return the first paired device whose name contains targetName, or 0.
FindDeviceByName(targetName)
{
    searchParams := MakeSearchParams()
    deviceInfo := Buffer(560, 0)
    NumPut("uint", 560, deviceInfo, 0)

    searchHandle := DllCall("Bthprops.cpl\BluetoothFindFirstDevice", "ptr", searchParams, "ptr", deviceInfo, "ptr")
    if !searchHandle
        return 0

    match := 0
    loop
    {
        if (InStr(StrGet(deviceInfo.Ptr + 64, "UTF-16"), targetName))
        {
            match := deviceInfo
            break
        }
        if !DllCall("Bthprops.cpl\BluetoothFindNextDevice", "ptr", searchHandle, "ptr", deviceInfo)
            break
    }

    DllCall("Bthprops.cpl\BluetoothFindDeviceClose", "ptr", searchHandle)
    return match
}

; Stereo-only success requires A2DP. Combined connects and disconnects require
; every exposed service to reach the requested state, while allowing devices
; that legitimately lack either Hands-Free or AudioSink.
IsSuccessfulOperation(action, audioProfile, hfStatus, asStatus)
{
    if (action = "connect" && audioProfile = "a2dp")
        return (asStatus = "ok" && (hfStatus = "ok" || hfStatus = "absent"))

    allExposedSucceeded := (hfStatus = "ok" || hfStatus = "absent")
        && (asStatus = "ok" || asStatus = "absent")
    atLeastOneProfileExists := (hfStatus = "ok" || asStatus = "ok")
    return (allExposedSucceeded && atLeastOneProfileExists)
}

; Toggle one Bluetooth audio service to the desired state.
; Returns "ok", "absent", or "fail:0x...".
ToggleBluetoothService(deviceInfo, serviceGuidStr, toggleOn, maxRetries)
{
    serviceGuid := Buffer(16)
    DllCall("ole32\CLSIDFromString", "wstr", serviceGuidStr, "ptr", serviceGuid)

    toggle := toggleOn
    retryCount := 0
    lastHr := 0
    loop
    {
        hr := DllCall("Bthprops.cpl\BluetoothSetServiceState", "ptr", 0, "ptr", deviceInfo, "ptr", serviceGuid, "int", toggle, "uint")
        lastHr := hr

        if (hr = 0)
        {
            if (toggle = toggleOn)
                return "ok"
            toggle := !toggle
        }
        else if (hr = 87 || hr = 0x80070057)
        {
            if (toggle = toggleOn && toggleOn = 0)
                return "ok"
            toggle := !toggle
        }
        else if (hr = 1060)
            return "absent"
        else if (hr = 1168 && toggleOn = 0 && StrLower(serviceGuidStr) = "{0000111e-0000-1000-8000-00805f9b34fb}")
            return "absent"

        retryCount++
        if (retryCount >= maxRetries)
            return "fail:0x" . Format("{:08X}", lastHr)
    }
}
