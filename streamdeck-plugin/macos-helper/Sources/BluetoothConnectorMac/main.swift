import Darwin
import Foundation
import IOBluetooth
import IOKit
import BluetoothConnectorCore

private let usage = "Usage: BluetoothConnectorMac <device name|-> <list|status|connect|disconnect>"

private func pairedDevices() -> [IOBluetoothDevice] {
    (IOBluetoothDevice.pairedDevices() as? [IOBluetoothDevice]) ?? []
}

private func findDevice(named name: String) -> IOBluetoothDevice? {
    pairedDevices().first {
        ($0.nameOrAddress ?? "").localizedCaseInsensitiveCompare(name) == .orderedSame
    }
}

private func waitForState(
    _ connected: Bool,
    device: IOBluetoothDevice,
    timeout: TimeInterval = 8
) -> Bool {
    let deadline = Date().addingTimeInterval(timeout)
    while Date() < deadline {
        if device.isConnected() == connected {
            return true
        }
        Thread.sleep(forTimeInterval: 0.2)
    }
    return device.isConnected() == connected
}

private func fail(_ message: String, code: Int32 = 1) -> Never {
    FileHandle.standardError.write(Data(("ERROR: \(message)\n").utf8))
    exit(code)
}

private func run(_ command: Command) {
    switch command {
    case .list:
        let names = pairedDevices()
            .compactMap { $0.nameOrAddress }
            .filter { !$0.isEmpty }
            .sorted { $0.localizedCaseInsensitiveCompare($1) == .orderedAscending }
        names.forEach { print($0) }

    case let .status(deviceName):
        guard let device = findDevice(named: deviceName) else {
            fail("Target Bluetooth device '\(deviceName)' not found", code: 2)
        }
        print(device.isConnected() ? "CONNECTED" : "DISCONNECTED")

    case let .connect(deviceName):
        guard let device = findDevice(named: deviceName) else {
            fail("Target Bluetooth device '\(deviceName)' not found", code: 2)
        }
        if !device.isConnected() {
            let result = device.openConnection()
            guard result == kIOReturnSuccess else {
                fail("Could not connect '\(deviceName)' (IOBluetooth error \(result))", code: 3)
            }
        }
        guard waitForState(true, device: device) else {
            fail("Timed out while connecting '\(deviceName)'", code: 4)
        }
        print("SUCCESS: Bluetooth device '\(device.nameOrAddress ?? deviceName)' connected")

    case let .disconnect(deviceName):
        guard let device = findDevice(named: deviceName) else {
            fail("Target Bluetooth device '\(deviceName)' not found", code: 2)
        }
        if device.isConnected() {
            let result = device.closeConnection()
            guard result == kIOReturnSuccess else {
                fail("Could not disconnect '\(deviceName)' (IOBluetooth error \(result))", code: 3)
            }
        }
        guard waitForState(false, device: device) else {
            fail("Timed out while disconnecting '\(deviceName)'", code: 4)
        }
        print("SUCCESS: Bluetooth device '\(device.nameOrAddress ?? deviceName)' disconnected")
    }
}

do {
    run(try Command.parse(arguments: Array(CommandLine.arguments.dropFirst())))
} catch {
    fail(usage, code: 64)
}
