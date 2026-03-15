import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#foxclaw",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#foxclaw",
      rawTarget: "#foxclaw",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "foxclaw-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "foxclaw-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "foxclaw-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "foxclaw-bot",
      rawTarget: "foxclaw-bot",
    });
  });
});
