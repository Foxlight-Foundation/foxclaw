import { beforeEach, describe, expect, it, vi } from "vitest";

const normalizeMessageChannelMock = vi.hoisted(() => vi.fn());

vi.mock("../utils/message-channel.js", () => ({
  INTERNAL_MESSAGE_CHANNEL: "web",
  normalizeMessageChannel: (...args: unknown[]) => normalizeMessageChannelMock(...args),
}));

import {
  hasConfiguredExecApprovalDmRoute,
  resolveExecApprovalInitiatingSurfaceState,
} from "./exec-approval-surface.js";

describe("resolveExecApprovalInitiatingSurfaceState", () => {
  beforeEach(() => {
    normalizeMessageChannelMock.mockReset();
    normalizeMessageChannelMock.mockImplementation((value?: string | null) =>
      typeof value === "string" ? value.trim().toLowerCase() : undefined,
    );
  });

  it("treats web UI, terminal UI, and missing channels as enabled", () => {
    expect(resolveExecApprovalInitiatingSurfaceState({ channel: null })).toEqual({
      kind: "enabled",
      channel: undefined,
      channelLabel: "this platform",
    });
    expect(resolveExecApprovalInitiatingSurfaceState({ channel: "tui" })).toEqual({
      kind: "enabled",
      channel: "tui",
      channelLabel: "terminal UI",
    });
    expect(resolveExecApprovalInitiatingSurfaceState({ channel: "web" })).toEqual({
      kind: "enabled",
      channel: "web",
      channelLabel: "Web UI",
    });
  });

  it("marks non-built-in channels as unsupported", () => {
    expect(
      resolveExecApprovalInitiatingSurfaceState({ channel: "slack" }),
    ).toEqual({
      kind: "unsupported",
      channel: "slack",
      channelLabel: "Slack",
    });
  });
});

describe("hasConfiguredExecApprovalDmRoute", () => {
  it("returns false since channel-specific exec approval routes are no longer supported", () => {
    expect(hasConfiguredExecApprovalDmRoute({} as never)).toBe(false);
  });
});
