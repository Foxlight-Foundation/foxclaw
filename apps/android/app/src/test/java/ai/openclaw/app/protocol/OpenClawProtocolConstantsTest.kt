package ai.foxclaw.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class FoxClawProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", FoxClawCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", FoxClawCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", FoxClawCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", FoxClawCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", FoxClawCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", FoxClawCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", FoxClawCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", FoxClawCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", FoxClawCapability.Canvas.rawValue)
    assertEquals("camera", FoxClawCapability.Camera.rawValue)
    assertEquals("voiceWake", FoxClawCapability.VoiceWake.rawValue)
    assertEquals("location", FoxClawCapability.Location.rawValue)
    assertEquals("sms", FoxClawCapability.Sms.rawValue)
    assertEquals("device", FoxClawCapability.Device.rawValue)
    assertEquals("notifications", FoxClawCapability.Notifications.rawValue)
    assertEquals("system", FoxClawCapability.System.rawValue)
    assertEquals("photos", FoxClawCapability.Photos.rawValue)
    assertEquals("contacts", FoxClawCapability.Contacts.rawValue)
    assertEquals("calendar", FoxClawCapability.Calendar.rawValue)
    assertEquals("motion", FoxClawCapability.Motion.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", FoxClawCameraCommand.List.rawValue)
    assertEquals("camera.snap", FoxClawCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", FoxClawCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", FoxClawNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", FoxClawNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", FoxClawDeviceCommand.Status.rawValue)
    assertEquals("device.info", FoxClawDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", FoxClawDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", FoxClawDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", FoxClawSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", FoxClawPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", FoxClawContactsCommand.Search.rawValue)
    assertEquals("contacts.add", FoxClawContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", FoxClawCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", FoxClawCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", FoxClawMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", FoxClawMotionCommand.Pedometer.rawValue)
  }
}
