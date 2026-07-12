# BluetoothConnectorMac

Native macOS command-line backend for the Stream Deck plugin. It deliberately uses
the same interface and output markers as `BluetoothConnector.exe`:

```text
BluetoothConnectorMac - list
BluetoothConnectorMac "AirPods Pro" status
BluetoothConnectorMac "AirPods Pro" connect
BluetoothConnectorMac "AirPods Pro" disconnect
```

Build and test on macOS 13 or later:

```sh
swift test
swift build -c release --arch arm64 --arch x86_64
```

`openConnection()` establishes the Bluetooth baseband connection. Activation of
the expected A2DP/HFP audio profile must be confirmed on real Bluetooth hardware
before this backend is considered production-ready.
