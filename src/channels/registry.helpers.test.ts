import { describe, expect, it } from "vitest";
import {
  formatChannelSelectionLine,
  listChatChannels,
  normalizeChatChannelId,
} from "./registry.js";

describe("channel registry helpers", () => {
  it("normalizes slack and rejects unknown channels", () => {
    expect(normalizeChatChannelId("slack")).toBe("slack");
    expect(normalizeChatChannelId(" Slack ")).toBe("slack");
    expect(normalizeChatChannelId("web")).toBeNull();
    expect(normalizeChatChannelId("nope")).toBeNull();
  });

  it("lists only slack", () => {
    const channels = listChatChannels();
    expect(channels).toHaveLength(1);
    expect(channels[0]?.id).toBe("slack");
  });

  it("formats selection lines with docs labels + website extras", () => {
    const channels = listChatChannels();
    const first = channels[0];
    if (!first) {
      throw new Error("Missing channel metadata.");
    }
    const line = formatChannelSelectionLine(first, (path, label) =>
      [label, path].filter(Boolean).join(":"),
    );
    expect(line).toContain("Docs:");
    expect(line).toContain("/channels/slack");
  });
});
