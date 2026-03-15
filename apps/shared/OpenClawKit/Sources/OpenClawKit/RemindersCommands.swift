import Foundation

public enum FoxClawRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum FoxClawReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct FoxClawRemindersListParams: Codable, Sendable, Equatable {
    public var status: FoxClawReminderStatusFilter?
    public var limit: Int?

    public init(status: FoxClawReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct FoxClawRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct FoxClawReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct FoxClawRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [FoxClawReminderPayload]

    public init(reminders: [FoxClawReminderPayload]) {
        self.reminders = reminders
    }
}

public struct FoxClawRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: FoxClawReminderPayload

    public init(reminder: FoxClawReminderPayload) {
        self.reminder = reminder
    }
}
