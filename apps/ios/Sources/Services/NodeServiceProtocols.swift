import CoreLocation
import Foundation
import FoxClawKit
import UIKit

typealias FoxClawCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias FoxClawCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: FoxClawCameraSnapParams) async throws -> FoxClawCameraSnapResult
    func clip(params: FoxClawCameraClipParams) async throws -> FoxClawCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: FoxClawLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: FoxClawLocationGetParams,
        desiredAccuracy: FoxClawLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: FoxClawLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> FoxClawDeviceStatusPayload
    func info() -> FoxClawDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: FoxClawPhotosLatestParams) async throws -> FoxClawPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: FoxClawContactsSearchParams) async throws -> FoxClawContactsSearchPayload
    func add(params: FoxClawContactsAddParams) async throws -> FoxClawContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: FoxClawCalendarEventsParams) async throws -> FoxClawCalendarEventsPayload
    func add(params: FoxClawCalendarAddParams) async throws -> FoxClawCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: FoxClawRemindersListParams) async throws -> FoxClawRemindersListPayload
    func add(params: FoxClawRemindersAddParams) async throws -> FoxClawRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: FoxClawMotionActivityParams) async throws -> FoxClawMotionActivityPayload
    func pedometer(params: FoxClawPedometerParams) async throws -> FoxClawPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: FoxClawWatchNotifyParams) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
