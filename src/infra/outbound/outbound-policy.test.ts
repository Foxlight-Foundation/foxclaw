import { describe, expect, it } from "vitest";
import type { FoxClawConfig } from "../../config/config.js";
import {
  applyCrossContextDecoration,
  buildCrossContextDecoration,
  enforceCrossContextPolicy,
  shouldApplyCrossContextMarker,
} from "./outbound-policy.js";

const slackConfig = {
  channels: {
    slack: {
      botToken: "xoxb-test",
      appToken: "xapp-test",
    },
  },
} as FoxClawConfig;

describe("outbound policy helpers", () => {
  it("allows cross-provider sends when enabled", () => {
    const cfg = {
      ...slackConfig,
      tools: {
        message: { crossContext: { allowAcrossProviders: true } },
      },
    } as FoxClawConfig;

    expect(() =>
      enforceCrossContextPolicy({
        cfg,
        channel: "slack",
        action: "send",
        args: { to: "slack:C999" },
        toolContext: { currentChannelId: "C12345678", currentChannelProvider: "slack" },
      }),
    ).not.toThrow();
  });

  it("blocks same-provider cross-context sends when allowWithinProvider is false", () => {
    const cfg = {
      ...slackConfig,
      tools: {
        message: { crossContext: { allowWithinProvider: false } },
      },
    } as FoxClawConfig;

    expect(() =>
      enforceCrossContextPolicy({
        cfg,
        channel: "slack",
        action: "send",
        args: { to: "C999" },
        toolContext: { currentChannelId: "C123", currentChannelProvider: "slack" },
      }),
    ).toThrow(/target="C999" while bound to "C123"/);
  });

  it("returns null when decoration is skipped and falls back to text markers", async () => {
    await expect(
      buildCrossContextDecoration({
        cfg: slackConfig,
        channel: "slack",
        target: "C999",
        toolContext: {
          currentChannelId: "C12345678",
          currentChannelProvider: "slack",
          skipCrossContextDecoration: true,
        },
      }),
    ).resolves.toBeNull();

    const applied = applyCrossContextDecoration({
      message: "hello",
      decoration: { prefix: "[from ops] ", suffix: " [cc]" },
      preferComponents: true,
    });
    expect(applied).toEqual({
      message: "[from ops] hello [cc]",
      usedComponents: false,
    });
  });

  it("marks only supported cross-context actions", () => {
    expect(shouldApplyCrossContextMarker("send")).toBe(true);
    expect(shouldApplyCrossContextMarker("thread-reply")).toBe(true);
    expect(shouldApplyCrossContextMarker("thread-create")).toBe(false);
  });
});
