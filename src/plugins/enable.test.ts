import { describe, expect, it } from "vitest";
import type { FoxClawConfig } from "../config/config.js";
import { enablePluginInConfig } from "./enable.js";

describe("enablePluginInConfig", () => {
  it("enables a plugin entry", () => {
    const cfg: FoxClawConfig = {};
    const result = enablePluginInConfig(cfg, "google-gemini-cli-auth");
    expect(result.enabled).toBe(true);
    expect(result.config.plugins?.entries?.["google-gemini-cli-auth"]?.enabled).toBe(true);
  });

  it("adds plugin to allowlist when allowlist is configured", () => {
    const cfg: FoxClawConfig = {
      plugins: {
        allow: ["memory-core"],
      },
    };
    const result = enablePluginInConfig(cfg, "google-gemini-cli-auth");
    expect(result.enabled).toBe(true);
    expect(result.config.plugins?.allow).toEqual(["memory-core", "google-gemini-cli-auth"]);
  });

  it("refuses enable when plugin is denylisted", () => {
    const cfg: FoxClawConfig = {
      plugins: {
        deny: ["google-gemini-cli-auth"],
      },
    };
    const result = enablePluginInConfig(cfg, "google-gemini-cli-auth");
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe("blocked by denylist");
  });

  it("writes built-in channels to channels.<id>.enabled and plugins.entries", () => {
    const cfg: FoxClawConfig = {};
    const result = enablePluginInConfig(cfg, "slack");
    expect(result.enabled).toBe(true);
    expect(result.config.channels?.slack?.enabled).toBe(true);
    expect(result.config.plugins?.entries?.slack?.enabled).toBe(true);
  });

  it("adds built-in channel id to allowlist when allowlist is configured", () => {
    const cfg: FoxClawConfig = {
      plugins: {
        allow: ["memory-core"],
      },
    };
    const result = enablePluginInConfig(cfg, "slack");
    expect(result.enabled).toBe(true);
    expect(result.config.channels?.slack?.enabled).toBe(true);
    expect(result.config.plugins?.allow).toEqual(["memory-core", "slack"]);
  });

  it("re-enables built-in channels after explicit plugin-level disable", () => {
    const cfg: FoxClawConfig = {
      channels: {
        slack: {
          enabled: true,
        },
      },
      plugins: {
        entries: {
          slack: {
            enabled: false,
          },
        },
      },
    };
    const result = enablePluginInConfig(cfg, "slack");
    expect(result.enabled).toBe(true);
    expect(result.config.channels?.slack?.enabled).toBe(true);
    expect(result.config.plugins?.entries?.slack?.enabled).toBe(true);
  });
});
