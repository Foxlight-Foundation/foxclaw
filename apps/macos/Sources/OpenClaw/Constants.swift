import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-foxclaw writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.foxclaw.mac"
let gatewayLaunchdLabel = "ai.foxclaw.gateway"
let onboardingVersionKey = "foxclaw.onboardingVersion"
let onboardingSeenKey = "foxclaw.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "foxclaw.pauseEnabled"
let iconAnimationsEnabledKey = "foxclaw.iconAnimationsEnabled"
let swabbleEnabledKey = "foxclaw.swabbleEnabled"
let swabbleTriggersKey = "foxclaw.swabbleTriggers"
let voiceWakeTriggerChimeKey = "foxclaw.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "foxclaw.voiceWakeSendChime"
let showDockIconKey = "foxclaw.showDockIcon"
let defaultVoiceWakeTriggers = ["foxclaw"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "foxclaw.voiceWakeMicID"
let voiceWakeMicNameKey = "foxclaw.voiceWakeMicName"
let voiceWakeLocaleKey = "foxclaw.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "foxclaw.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "foxclaw.voicePushToTalkEnabled"
let talkEnabledKey = "foxclaw.talkEnabled"
let iconOverrideKey = "foxclaw.iconOverride"
let connectionModeKey = "foxclaw.connectionMode"
let remoteTargetKey = "foxclaw.remoteTarget"
let remoteIdentityKey = "foxclaw.remoteIdentity"
let remoteProjectRootKey = "foxclaw.remoteProjectRoot"
let remoteCliPathKey = "foxclaw.remoteCliPath"
let canvasEnabledKey = "foxclaw.canvasEnabled"
let cameraEnabledKey = "foxclaw.cameraEnabled"
let systemRunPolicyKey = "foxclaw.systemRunPolicy"
let systemRunAllowlistKey = "foxclaw.systemRunAllowlist"
let systemRunEnabledKey = "foxclaw.systemRunEnabled"
let locationModeKey = "foxclaw.locationMode"
let locationPreciseKey = "foxclaw.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "foxclaw.peekabooBridgeEnabled"
let deepLinkKeyKey = "foxclaw.deepLinkKey"
let modelCatalogPathKey = "foxclaw.modelCatalogPath"
let modelCatalogReloadKey = "foxclaw.modelCatalogReload"
let cliInstallPromptedVersionKey = "foxclaw.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "foxclaw.heartbeatsEnabled"
let debugPaneEnabledKey = "foxclaw.debugPaneEnabled"
let debugFileLogEnabledKey = "foxclaw.debug.fileLogEnabled"
let appLogLevelKey = "foxclaw.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
