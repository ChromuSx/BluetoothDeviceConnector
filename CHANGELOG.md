# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0.1-beta.2] - 2026-07-12

### Fixed
- Include the `ws` runtime dependency in CI-built plugin bundles. Beta 1 could not start on either Windows or macOS and left the Property Inspector on “Detecting devices…”.

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

## [1.1.0.5] - 2026-08-06

### Added
- After a successful Windows connection, the plugin now selects and verifies the matching default playback endpoint. With the combined A2DP + HFP profile, it also attempts to select and verify the device's microphone when Windows exposes one.

### Fixed
- Switching Bluetooth targets no longer leaves Windows audio routed to the previously active device.
- Migrating a key from the implicit legacy default device now preserves that device as the pending handoff target, so it is disconnected before the newly selected device connects.

## [1.1.0.4] - 2026-08-06

### Added
- Changing the device assigned to a Stream Deck key now creates an exclusive handoff: the next press disconnects that key's previous audio target before connecting the newly selected one.

### Fixed
- Rapid Property Inspector changes no longer race plugin-side handoff updates or restore an older device selection.
- Connect/disconnect operations no longer report success when one exposed Bluetooth audio service failed to reach the requested state.
- macOS helper failures now preserve `stderr` details for accurate not-found handling and diagnostics.
- Delayed visual-feedback timers can no longer overwrite a newer action or settings state.

## [1.1.0.3] - 2026-08-06

### Fixed
- A2DP-only connections no longer show an error when Windows reports `ERROR_NOT_FOUND` for an already unavailable Hands-Free profile.

## [1.1.0.2] - 2026-08-06

### Added
- Stream Deck keys can now select **Stereo only (A2DP)** or **Stereo + microphone (A2DP + HFP)** on Windows.

### Changed
- Stereo-only connections explicitly disable Hands-Free before enabling A2DP, while existing keys without the new setting retain their combined-profile behavior.
- Stereo-only keys reconcile A2DP on their first press when Windows reports only a device-wide Bluetooth connection.
- Updated the bundled `ws` runtime dependency to 8.21.2.

### Fixed
- Manual helper launches without an attached console now return cleanly instead of showing an AutoHotkey invalid-handle dialog.
