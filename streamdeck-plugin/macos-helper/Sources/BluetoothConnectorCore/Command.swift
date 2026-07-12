import Foundation

public enum Command: Equatable {
    case list
    case status(deviceName: String)
    case connect(deviceName: String)
    case disconnect(deviceName: String)

    public static func parse(arguments: [String]) throws -> Command {
        guard arguments.count == 2 else {
            throw CommandError.usage
        }

        let deviceName = arguments[0]
        switch arguments[1].lowercased() {
        case "list":
            return .list
        case "status" where !deviceName.isEmpty && deviceName != "-":
            return .status(deviceName: deviceName)
        case "connect" where !deviceName.isEmpty && deviceName != "-":
            return .connect(deviceName: deviceName)
        case "disconnect" where !deviceName.isEmpty && deviceName != "-":
            return .disconnect(deviceName: deviceName)
        default:
            throw CommandError.usage
        }
    }
}

public enum CommandError: Error, Equatable {
    case usage
}
