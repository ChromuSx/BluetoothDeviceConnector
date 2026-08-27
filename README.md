# 🎧 BluetoothDeviceConnector

<div align="center">
  <img src="logo.png" alt="BluetoothDeviceConnector" width="200">
</div>

<div align="center">
  <img src="https://img.shields.io/badge/AutoHotkey-334455?style=for-the-badge&logo=autohotkey&logoColor=white" alt="AutoHotkey">
  <img src="https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows">
  <img src="https://img.shields.io/badge/Bluetooth-0082FC?style=for-the-badge&logo=bluetooth&logoColor=white" alt="Bluetooth">
</div>
<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
  <img src="https://img.shields.io/badge/Version-1.1.0.5-brightgreen?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/github/downloads/ChromuSx/BluetoothDeviceConnector/total?style=for-the-badge&logo=github" alt="Downloads">
  <img src="https://img.shields.io/github/stars/ChromuSx/BluetoothDeviceConnector?style=for-the-badge" alt="Stars">
</p>
<p align="center">
  <a href="https://github.com/sponsors/ChromuSx"><img src="https://img.shields.io/badge/Sponsor-GitHub-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white" alt="GitHub Sponsors"></a>
  <a href="https://ko-fi.com/chromus"><img src="https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
  <a href="https://buymeacoffee.com/chromus"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee"></a>
  <a href="https://www.paypal.com/paypalme/giovanniguarino1999"><img src="https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal"></a>
</p>
<p align="center">
  <strong>🔗 BluetoothDeviceConnector is an AutoHotkey script that connects or disconnects a paired Bluetooth audio device with either stereo-only playback or stereo plus microphone support.</strong>
</p>

## ✨ Features
- Automatically searches for the specified paired Bluetooth device.
- Connects or disconnects the device using editable defaults or command-line arguments.
- Selects **Stereo only (A2DP)** or **Stereo + microphone (A2DP + Hands-Free)**.
- Supports speaker-only devices that do not expose a Hands-Free profile.
- Provides visual notifications for success or errors.
- **🎮 Stream Deck Integration**: One-click Bluetooth connection directly from your Elgato Stream Deck!

## 🎮 Stream Deck Plugin

This project includes an **official Stream Deck plugin** that lets you connect your Bluetooth devices with a single button press!

<div align="center">
  <a href="https://marketplace.elgato.com/product/bluetooth-device-connector-d7e642fc-1199-4ca0-9849-e303281dd07d">
    <img src="https://img.shields.io/badge/Elgato%20Marketplace-Get%20Plugin-black?style=for-the-badge&logo=elgato&logoColor=white" alt="Elgato Marketplace">
  </a>
</div>

### 🎬 See It in Action

https://github.com/user-attachments/assets/5979afac-3f7b-4a8e-8ae6-d056be1e6f8e

<sub>▶ Press play for sound. Not rendering in GitHub? <a href="streamdeck-plugin/marketplace/promo.mp4">Download the MP4</a>.</sub>

### Quick Start
1. Install directly from the [Elgato Marketplace](https://marketplace.elgato.com/product/bluetooth-device-connector-d7e642fc-1199-4ca0-9849-e303281dd07d) or download from [GitHub Releases](https://github.com/ChromuSx/BluetoothDeviceConnector/releases/latest)
2. Add the "Connect Bluetooth Device" action to your Stream Deck
3. Pick your device and audio profile, then connect with one press!

### Features
- ✅ One-click connect/disconnect toggle
- 🔍 Device picker — choose a paired device from a dropdown in the Property Inspector
- 🎧 Per-key audio profile — choose stereo-only A2DP or stereo plus the Hands-Free microphone on Windows
- 🔁 Exclusive same-key handoff — changing a key's device disconnects its previous target before connecting the new one
- 🔊 Verified Windows audio routing — a successful connection selects and verifies the matching default playback endpoint, and tries the Hands-Free microphone when available
- 🔊 Speaker-only device support (Amazon Echo Dot, Bluetooth speakers, and devices without HFP)
- 📡 Safe restart state — Windows keys reapply their selected audio profile on the first press when device-wide Bluetooth status cannot prove the audio services are active
- 🎯 Visual feedback (Disconnected / Connecting / Connected / Error states)
- 🚀 Fast and lightweight

[→ Learn more about the Stream Deck plugin](streamdeck-plugin/)

## 🛠️ Requirements
- **Operating System**: Windows
- **Libraries**: The script uses the Bluetooth control library provided by Windows (`Bthprops.cpl`).
- **System Icon**: The script uses a system icon (requires the path `C:\WINDOWS\system32\netshell.dll`).
- **AutoHotkey v2**: Must be installed to run this script. [Download AutoHotkey v2](https://www.autohotkey.com/).

## 🚀 How to Use
1. **Install AutoHotkey v2**: Make sure AutoHotkey v2 is installed.
2. **Copy the code**: Copy the script code into `bluetooth_device_connector.ahk`.
3. **Run the script**: Double-click the `.ahk` file to run the script.

### ⚙️ Configuration
Modify the three variables at the beginning of the script. Existing behavior remains the default: connect `AirPods Pro` with stereo playback and its Hands-Free microphone enabled.

```ahk
deviceName := "AirPods Pro"
action := "connect"           ; "connect" or "disconnect"
audioProfile := "a2dp-hfp"   ; "a2dp" or "a2dp-hfp"
```

Use `audioProfile := "a2dp"` when you want stereo playback without enabling the Windows Hands-Free microphone profile.

The same values can be supplied without editing the file:

```powershell
AutoHotkey64.exe bluetooth_device_connector.ahk "Echo Dot" connect a2dp
AutoHotkey64.exe bluetooth_device_connector.ahk "AirPods Pro" disconnect a2dp-hfp
```

## 🧠 How It Works
The script uses the Windows Bluetooth Control Panel library (`Bthprops.cpl`) to find the desired device and manage two services:

- **Handsfree**: Connection for voice communications (e.g., calls).
- **AudioSink**: Connection for audio streaming (e.g., music).

Stereo-only mode disables Hands-Free before enabling AudioSink. Combined mode enables both services, while disconnect mode disables both. Devices that expose only one applicable audio service remain supported.

## 🔔 Notifications
The script will display notifications in case of:
- No Bluetooth device found.
- Device successfully connected or disconnected.
- Invalid action or audio-profile configuration.

## ⚠️ Limitations
- Each launch operates on one configured device; use command-line arguments or separate script copies for multiple targets.
- The standalone script manages Bluetooth services but does not change the Windows default playback endpoint. The Stream Deck plugin includes verified default-device routing.
- It works only on Windows, using the Bluetooth libraries provided by the operating system.

## 🛠️ Customization
You can customize the script to include more devices or add extra functionality. AutoHotkey is a versatile scripting language that allows you to automate many operations on Windows.

## 🤝 Contributions
Contributions and improvements are welcome! Feel free to submit a pull request or report any issues on [GitHub](https://github.com/ChromuSx/BluetoothDeviceConnector).

## 💖 Support the Project
This project is completely free and open source. If you find it useful and would like to support its continued development and updates, consider making a donation. Your support helps keep the project alive and motivates me to add new features and improvements!

<div align="center">
  <a href="https://github.com/sponsors/ChromuSx"><img src="https://img.shields.io/badge/Sponsor-GitHub-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white" alt="GitHub Sponsors"></a>
  <a href="https://ko-fi.com/chromus"><img src="https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
  <a href="https://buymeacoffee.com/chromus"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee"></a>
  <a href="https://www.paypal.com/paypalme/giovanniguarino1999"><img src="https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal"></a>
</div>

Every contribution, no matter how small, is greatly appreciated! ❤️

## 📜 License
This project is licensed under the MIT License. Feel free to use, modify, and distribute the script as you like.

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/ChromuSx">Giovanni Guarino</a></sub>
</div>
