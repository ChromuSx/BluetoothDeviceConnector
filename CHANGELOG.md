# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Experimental macOS 13+ support for the Stream Deck plugin through a native universal Swift helper.
- macOS CI build, parser tests, and an installable beta artifact for hardware testing.

### Changed
- The Stream Deck runtime now selects the Windows or macOS Bluetooth helper automatically.
- System feedback sounds and Bluetooth setup text are platform-aware.

## [1.0.5.0] - 2026-05-31

### Fixed
- **Speaker-only devices now connect** (e.g. Amazon Echo Dot, Bluetooth speakers). Connecting no longer aborts when a device lacks the Handsfree (HFP) profile; each audio profile is toggled independently and the action succeeds if at least one connects.
- **Device names with special characters** no longer break the command — the helper executable is now invoked with an argument array instead of a shell string.
- **Button no longer gets stuck on "Connecting"** when the helper returns unexpected output.
- Standalone script: added a retry cap that previously allowed an infinite loop on unsupported devices.

### Added
- **Device picker** in the Property Inspector — choose a paired device from a dropdown instead of typing its exact name.
- **Live connection state** — the key reflects the device's real connection status when it appears (survives Stream Deck restarts).

### Changed
- Disabled Node debug mode in the published manifest.
- Slimmed the packaged plugin to the runtime dependency only.

## [1.0.4.0] - 2025-12-17

### Fixed
- Resolved disconnect issues and multiple-instance errors for the Marketplace submission.

## [1.0.1] - 2025-12-06

### Changed
- **Compiled AutoHotkey script to standalone executable** - Plugin now uses `BluetoothConnector.exe` instead of runtime + script
- **Improved startup performance** - No script parsing overhead
- **Simplified package structure** - Single executable instead of two files

### Removed
- AutoHotkey64.exe runtime (no longer needed)
- bluetooth_connector.ahk script file (compiled into .exe)

## [1.0.0] - 2025-12-06

### Added

#### Stream Deck Plugin
- **Initial Stream Deck plugin release** - Connect/disconnect Bluetooth devices with a single button press
- **Visual state indicators** - Button shows different states with colored overlays:
  - Disconnected (default icon)
  - Connecting (orange dot)
  - Connected (green dot)
  - Error (red dot)
- **Toggle functionality** - Press once to connect, press again to disconnect
- **Audio notifications** - Windows system sounds for success and error states
- **Visual notifications** - Temporary text display on button ("Connected!", "Disconnected!", "Error!")
- **Multi-device support** - Add multiple plugin instances for different Bluetooth devices
- **Configurable device name** - Set target device in Property Inspector
- **AutoHotkey v2 migration** - Migrated script from v1 to v2 for better performance

#### Core Features
- Bluetooth device connection via Windows Bluetooth API
- Support for audio devices (Handsfree and AudioSink profiles)
- CLI support for automation and integration

### Technical Details
- Built with TypeScript and Node.js
- Uses Stream Deck SDK v2
- AutoHotkey v2 for Windows Bluetooth control
- WebSocket communication between Stream Deck and plugin
- State management for connection tracking

### Package Contents
- Stream Deck plugin with all icons
- AutoHotkey runtime and script
- Property Inspector for configuration
- Complete documentation

---

## [Unreleased]

### Planned Features
- Configurable connection timeout
- Custom sound notifications
- Auto-reconnect on connection loss
- Connection history and logging
