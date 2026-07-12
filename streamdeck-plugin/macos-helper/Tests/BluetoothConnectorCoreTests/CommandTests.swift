import XCTest
@testable import BluetoothConnectorCore

final class CommandTests: XCTestCase {
    func testParsesListUsingExistingCLIShape() throws {
        XCTAssertEqual(try Command.parse(arguments: ["-", "list"]), .list)
    }

    func testParsesDeviceCommands() throws {
        XCTAssertEqual(
            try Command.parse(arguments: ["AirPods Pro", "status"]),
            .status(deviceName: "AirPods Pro")
        )
        XCTAssertEqual(
            try Command.parse(arguments: ["AirPods Pro", "connect"]),
            .connect(deviceName: "AirPods Pro")
        )
        XCTAssertEqual(
            try Command.parse(arguments: ["AirPods Pro", "disconnect"]),
            .disconnect(deviceName: "AirPods Pro")
        )
    }

    func testRejectsMissingDeviceNameAndUnknownActions() {
        XCTAssertThrowsError(try Command.parse(arguments: ["-", "connect"]))
        XCTAssertThrowsError(try Command.parse(arguments: ["AirPods Pro", "pair"]))
        XCTAssertThrowsError(try Command.parse(arguments: []))
    }
}
