import { describe, expect, it } from "vitest";
import { validateConfigObject } from "./config.js";

describe('dmPolicy="allowlist" requires non-empty effective allowFrom', () => {
  it('rejects slack dmPolicy="allowlist" without allowFrom', () => {
    const res = validateConfigObject({
      channels: { slack: { dmPolicy: "allowlist" } },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues.some((i) => i.path.includes("slack") && i.path.includes("allowFrom"))).toBe(
        true,
      );
    }
  });
});

describe('account dmPolicy="allowlist" uses inherited allowFrom', () => {
  it("accepts slack account allowlist when parent allowFrom exists", () => {
    const res = validateConfigObject({
      channels: {
        slack: {
          allowFrom: ["U123"],
          botToken: "xoxb-top",
          appToken: "xapp-top",
          accounts: {
            work: { dmPolicy: "allowlist", botToken: "xoxb-work", appToken: "xapp-work" },
          },
        },
      },
    });
    expect(res.ok).toBe(true);
  });
});
