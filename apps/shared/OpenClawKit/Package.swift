// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "FoxClawKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "FoxClawProtocol", targets: ["FoxClawProtocol"]),
        .library(name: "FoxClawKit", targets: ["FoxClawKit"]),
        .library(name: "FoxClawChatUI", targets: ["FoxClawChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "FoxClawProtocol",
            path: "Sources/FoxClawProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "FoxClawKit",
            dependencies: [
                "FoxClawProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/FoxClawKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "FoxClawChatUI",
            dependencies: [
                "FoxClawKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/FoxClawChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "FoxClawKitTests",
            dependencies: ["FoxClawKit", "FoxClawChatUI"],
            path: "Tests/FoxClawKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
