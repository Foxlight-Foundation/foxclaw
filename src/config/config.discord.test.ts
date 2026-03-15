import { describe, it } from "vitest";

describe("config discord", () => {
  // Discord channel was removed from the codebase. Only Slack remains as a built-in channel.
  // These tests validated discord-specific config (guild maps, DM groups, numeric ID rejection).
  it.skip("removed: discord channel no longer exists", () => {});
});
