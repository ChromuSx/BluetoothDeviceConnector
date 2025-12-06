# Bluetooth Device Connector - Stream Deck Plugin

Connect your Bluetooth devices with a single button press on your Elgato Stream Deck.

## Features

- 🎯 One-click Bluetooth device connection
- ⚙️ Configurable device names
- 🎧 Perfect for headphones, speakers, and other Bluetooth devices
- 💨 Fast and lightweight

## Installation

### Prerequisites

- Windows 10 or later
- Elgato Stream Deck software (version 6.9 or later)
- Node.js 20+ (for building from source)

### Installing the Plugin

1. Download the latest release `.streamDeckPlugin` file
2. Double-click the file to install it in Stream Deck
3. The plugin will appear in your Stream Deck actions list

### Building from Source

```bash
# Navigate to the plugin directory
cd BluetoothDeviceConnector-StreamDeck

# Install dependencies
npm install

# Build the plugin
npm run build
```

## Usage

1. Drag the "Connect Bluetooth Device" action onto a Stream Deck button
2. Click the button to open settings
3. Enter your Bluetooth device name (e.g., "AirPods Pro", "Sony WH-1000XM4")
4. Press the button to connect!

## Configuration

The plugin requires the exact name of your Bluetooth device as it appears in Windows Bluetooth settings.

### Finding Your Device Name

1. Open Windows Settings > Bluetooth & devices
2. Find your device in the list
3. Copy the exact name (case-sensitive)
4. Paste it into the plugin settings

### Common Device Names

- AirPods Pro
- AirPods Max
- Sony WH-1000XM4
- Bose QuietComfort
- Surface Headphones
- JBL Flip
- Beats Studio

## How It Works

The plugin uses Windows native Bluetooth APIs through AutoHotkey to connect devices. When you press the button:

1. Stream Deck sends the command to the plugin
2. The plugin executes AutoHotkey with your device name
3. AutoHotkey searches for and connects to the device
4. You get visual feedback on your Stream Deck (✓ or ✗)

## Troubleshooting

### Device Not Found

- Make sure your device is **paired** (not just connected) in Windows Bluetooth settings
- Verify the device name matches exactly (case-sensitive)
- Ensure your device is powered on and in range

### Connection Fails

- Try disconnecting and re-pairing your device in Windows settings
- Make sure no other device is currently connected to it
- Check if the device is already connected (it won't reconnect if already active)

### Plugin Not Appearing

- Make sure you have Stream Deck software version 6.9+
- Try restarting Stream Deck software
- Check if the plugin is enabled in Stream Deck preferences

## Technical Details

- **Platform**: Windows only
- **Dependencies**: Embedded AutoHotkey runtime (no installation required)
- **Bluetooth Services**: Connects both Handsfree and AudioSink profiles
- **Timeout**: 30 seconds per connection attempt

## Credits

Based on the [BluetoothDeviceConnector](https://github.com/ChromuSx/BluetoothDeviceConnector) project by ChromuSx.

## License

MIT License - See LICENSE file for details

## Support

If you find this plugin useful, consider supporting the developer:

- [GitHub Sponsors](https://github.com/sponsors/ChromuSx)
- [Ko-fi](https://ko-fi.com/chromus)
- [Buy Me a Coffee](https://buymeacoffee.com/chromus)
- [PayPal](https://www.paypal.com/paypalme/giovanniguarino1999)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
