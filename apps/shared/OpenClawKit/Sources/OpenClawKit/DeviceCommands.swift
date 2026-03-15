import Foundation

public enum FoxClawDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum FoxClawBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum FoxClawThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum FoxClawNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum FoxClawNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct FoxClawBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: FoxClawBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: FoxClawBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct FoxClawThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: FoxClawThermalState

    public init(state: FoxClawThermalState) {
        self.state = state
    }
}

public struct FoxClawStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct FoxClawNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: FoxClawNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [FoxClawNetworkInterfaceType]

    public init(
        status: FoxClawNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [FoxClawNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct FoxClawDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: FoxClawBatteryStatusPayload
    public var thermal: FoxClawThermalStatusPayload
    public var storage: FoxClawStorageStatusPayload
    public var network: FoxClawNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: FoxClawBatteryStatusPayload,
        thermal: FoxClawThermalStatusPayload,
        storage: FoxClawStorageStatusPayload,
        network: FoxClawNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct FoxClawDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
