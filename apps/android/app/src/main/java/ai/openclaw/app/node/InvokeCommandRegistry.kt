package ai.foxclaw.app.node

import ai.foxclaw.app.protocol.FoxClawCalendarCommand
import ai.foxclaw.app.protocol.FoxClawCanvasA2UICommand
import ai.foxclaw.app.protocol.FoxClawCanvasCommand
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

data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val smsAvailable: Boolean,
  val voiceWakeEnabled: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val debugBuild: Boolean,
)

enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  DebugBuild,
}

enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  VoiceWakeEnabled,
  MotionAvailable,
}

data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = FoxClawCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = FoxClawCapability.Device.rawValue),
      NodeCapabilitySpec(name = FoxClawCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = FoxClawCapability.System.rawValue),
      NodeCapabilitySpec(
        name = FoxClawCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = FoxClawCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(
        name = FoxClawCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
      NodeCapabilitySpec(
        name = FoxClawCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(name = FoxClawCapability.Photos.rawValue),
      NodeCapabilitySpec(name = FoxClawCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = FoxClawCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = FoxClawCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
    )

  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = FoxClawCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = FoxClawCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = FoxClawCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = FoxClawCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = FoxClawCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = FoxClawCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = FoxClawCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = FoxClawCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = FoxClawSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = FoxClawCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = FoxClawCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = FoxClawLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = FoxClawDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawPhotosCommand.Latest.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = FoxClawMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = FoxClawMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = FoxClawSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SmsAvailable,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> {
    return capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.smsAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
        }
      }
      .map { it.name }
  }

  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> {
    return all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SmsAvailable -> flags.smsAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
        }
      }
      .map { it.name }
  }
}
