// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "BluetoothConnectorMac",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "BluetoothConnectorMac", targets: ["BluetoothConnectorMac"])
    ],
    targets: [
        .target(name: "BluetoothConnectorCore"),
        .executableTarget(
            name: "BluetoothConnectorMac",
            dependencies: ["BluetoothConnectorCore"]
        ),
        .testTarget(
            name: "BluetoothConnectorCoreTests",
            dependencies: ["BluetoothConnectorCore"]
        )
    ]
)
