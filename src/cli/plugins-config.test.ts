import { describe, expect, it } from "vitest";
import type { FoxClawConfig } from "../config/config.js";
import { setPluginEnabledInConfig } from "./plugins-config.js";

describe("setPluginEnabledInConfig", () => {
  it("sets enabled flag for an existing plugin entry", () => {
    const config = {
      plugins: {
        entries: {
          alpha: { enabled: false, custom: "x" },
        },
      },
    } as FoxClawConfig;

    const next = setPluginEnabledInConfig(config, "alpha", true);

    expect(next.plugins?.entries?.alpha).toEqual({
      enabled: true,
      custom: "x",
    });
  });

  it("creates a plugin entry when it does not exist", () => {
    const config = {} as FoxClawConfig;

    const next = setPluginEnabledInConfig(config, "beta", false);

    expect(next.plugins?.entries?.beta).toEqual({
      enabled: false,
    });
  });

  it("keeps built-in channel and plugin entry flags in sync", () => {
    const config = {
      channels: {
        slack: {
          enabled: true,
          dmPolicy: "open",
        },
      },
      plugins: {
        entries: {
          slack: {
            enabled: true,
          },
        },
      },
    } as FoxClawConfig;

    const disabled = setPluginEnabledInConfig(config, "slack", false);
    expect(disabled.channels?.slack).toEqual({
      enabled: false,
      dmPolicy: "open",
    });
    expect(disabled.plugins?.entries?.slack).toEqual({
      enabled: false,
    });

    const reenabled = setPluginEnabledInConfig(disabled, "slack", true);
    expect(reenabled.channels?.slack).toEqual({
      enabled: true,
      dmPolicy: "open",
    });
    expect(reenabled.plugins?.entries?.slack).toEqual({
      enabled: true,
    });
  });
});
