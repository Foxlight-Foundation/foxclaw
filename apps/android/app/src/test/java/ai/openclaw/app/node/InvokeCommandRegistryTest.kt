package ai.foxclaw.app.node

import ai.foxclaw.app.protocol.FoxClawCalendarCommand
import ai.foxclaw.app.protocol.FoxClawCameraCommand
import ai.foxclaw.app.protocol.FoxClawCapability
import ai.foxclaw.app.protocol.FoxClawContactsCommand
import ai.foxclaw.app.protocol.FoxClawDeviceCommand
import ai.foxclaw.app.protocol.FoxClawLocationCommand
import ai.foxclaw.app.protocol.FoxClawMotionCommand
import ai.foxclaw.app.protocol.FoxClawNotificationsCommand
import ai.foxclaw.app.protocol.FoxClawPhotosCommand
import ai.foxclaw.app.protocol.FoxClawSmsCommand
import ai.foxclaw.app.protocol.FoxClawSystemCommand
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      FoxClawCapability.Canvas.rawValue,
      FoxClawCapability.Device.rawValue,
      FoxClawCapability.Notifications.rawValue,
      FoxClawCapability.System.rawValue,
      FoxClawCapability.Photos.rawValue,
      FoxClawCapability.Contacts.rawValue,
      FoxClawCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      FoxClawCapability.Camera.rawValue,
      FoxClawCapability.Location.rawValue,
      FoxClawCapability.Sms.rawValue,
      FoxClawCapability.VoiceWake.rawValue,
      FoxClawCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      FoxClawDeviceCommand.Status.rawValue,
      FoxClawDeviceCommand.Info.rawValue,
      FoxClawDeviceCommand.Permissions.rawValue,
      FoxClawDeviceCommand.Health.rawValue,
      FoxClawNotificationsCommand.List.rawValue,
      FoxClawNotificationsCommand.Actions.rawValue,
      FoxClawSystemCommand.Notify.rawValue,
      FoxClawPhotosCommand.Latest.rawValue,
      FoxClawContactsCommand.Search.rawValue,
      FoxClawContactsCommand.Add.rawValue,
      FoxClawCalendarCommand.Events.rawValue,
      FoxClawCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      FoxClawCameraCommand.Snap.rawValue,
      FoxClawCameraCommand.Clip.rawValue,
      FoxClawCameraCommand.List.rawValue,
      FoxClawLocationCommand.Get.rawValue,
      FoxClawMotionCommand.Activity.rawValue,
      FoxClawMotionCommand.Pedometer.rawValue,
      FoxClawSmsCommand.Send.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          smsAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(FoxClawMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(FoxClawMotionCommand.Pedometer.rawValue))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    smsAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      smsAvailable = smsAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
