// swift-tools-version: 6.2
// Package manifest for the FoxClaw macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "FoxClaw",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "FoxClawIPC", targets: ["FoxClawIPC"]),
        .library(name: "FoxClawDiscovery", targets: ["FoxClawDiscovery"]),
        .executable(name: "FoxClaw", targets: ["FoxClaw"]),
        .executable(name: "foxclaw-mac", targets: ["FoxClawMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/FoxClawKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "FoxClawIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "FoxClawDiscovery",
            dependencies: [
                .product(name: "FoxClawKit", package: "FoxClawKit"),
            ],
            path: "Sources/FoxClawDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "FoxClaw",
            dependencies: [
                "FoxClawIPC",
                "FoxClawDiscovery",
                .product(name: "FoxClawKit", package: "FoxClawKit"),
                .product(name: "FoxClawChatUI", package: "FoxClawKit"),
                .product(name: "FoxClawProtocol", package: "FoxClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/FoxClaw.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "FoxClawMacCLI",
            dependencies: [
                "FoxClawDiscovery",
                .product(name: "FoxClawKit", package: "FoxClawKit"),
                .product(name: "FoxClawProtocol", package: "FoxClawKit"),
            ],
            path: "Sources/FoxClawMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "FoxClawIPCTests",
            dependencies: [
                "FoxClawIPC",
                "FoxClaw",
                "FoxClawDiscovery",
                .product(name: "FoxClawProtocol", package: "FoxClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
