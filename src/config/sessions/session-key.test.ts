import { describe, expect, it } from "vitest";
import type { MsgContext } from "../../auto-reply/templating.js";
import { resolveSessionKey } from "./session-key.js";

function makeCtx(overrides: Partial<MsgContext>): MsgContext {
  return {
    Body: "",
    From: "",
    To: "",
    ...overrides,
  } as MsgContext;
}

describe("resolveSessionKey", () => {
  // Discord DM session key normalization tests were removed because
  // discord was stripped from the codebase and the normalizer no longer
  // handles discord-specific key patterns.

  it("passes through correct keys unchanged", () => {
    const ctx = makeCtx({
      SessionKey: "agent:fina:slack:direct:U123",
      ChatType: "direct",
      From: "slack:U123",
      SenderId: "U123",
    });
    expect(resolveSessionKey("per-sender", ctx)).toBe("agent:fina:slack:direct:u123");
  });

  it("does not rewrite channel keys for non-direct chats", () => {
    const ctx = makeCtx({
      SessionKey: "agent:fina:slack:channel:C123",
      ChatType: "channel",
      From: "slack:channel:C123",
      SenderId: "U789",
    });
    expect(resolveSessionKey("per-sender", ctx)).toBe("agent:fina:slack:channel:c123");
  });
});
