import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          FOXCLAW_STATE_DIR: "/tmp/foxclaw-state",
          FOXCLAW_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "foxclaw-gateway",
        windowsTaskName: "FoxClaw Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/foxclaw-state/logs/gateway.log",
      "Launchd stderr (if installed): /tmp/foxclaw-state/logs/gateway.err.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        systemdServiceName: "foxclaw-gateway",
        windowsTaskName: "FoxClaw Gateway",
      }),
    ).toEqual(["Logs: journalctl --user -u foxclaw-gateway.service -n 200 --no-pager"]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        systemdServiceName: "foxclaw-gateway",
        windowsTaskName: "FoxClaw Gateway",
      }),
    ).toEqual(['Logs: schtasks /Query /TN "FoxClaw Gateway" /V /FO LIST']);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "foxclaw gateway install",
        startCommand: "foxclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.foxclaw.gateway.plist",
        systemdServiceName: "foxclaw-gateway",
        windowsTaskName: "FoxClaw Gateway",
      }),
    ).toEqual([
      "foxclaw gateway install",
      "foxclaw gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.foxclaw.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "foxclaw gateway install",
        startCommand: "foxclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.foxclaw.gateway.plist",
        systemdServiceName: "foxclaw-gateway",
        windowsTaskName: "FoxClaw Gateway",
      }),
    ).toEqual([
      "foxclaw gateway install",
      "foxclaw gateway",
      "systemctl --user start foxclaw-gateway.service",
    ]);
  });
});
