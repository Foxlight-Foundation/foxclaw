import Foundation

public enum FoxClawCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum FoxClawCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum FoxClawCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum FoxClawCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct FoxClawCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: FoxClawCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: FoxClawCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: FoxClawCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: FoxClawCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct FoxClawCameraClipParams: Codable, Sendable, Equatable {
    public var facing: FoxClawCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: FoxClawCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: FoxClawCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: FoxClawCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
