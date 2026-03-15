import { describe, expect, it } from "vitest";
import type { MsgContext } from "../../auto-reply/templating.js";
import { normalizeExplicitSessionKey } from "./explicit-session-key-normalization.js";

function makeCtx(overrides: Partial<MsgContext>): MsgContext {
  return {
    Body: "",
    From: "",
    To: "",
    ...overrides,
  } as MsgContext;
}

describe("normalizeExplicitSessionKey", () => {
  // Discord-specific session key normalization tests were removed because
  // discord was stripped from the codebase.

  it("lowercases and passes through unknown providers unchanged", () => {
    expect(
      normalizeExplicitSessionKey(
        "Agent:Fina:Slack:DM:ABC",
        makeCtx({
          Surface: "slack",
          From: "slack:U123",
        }),
      ),
    ).toBe("agent:fina:slack:dm:abc");
  });
});
