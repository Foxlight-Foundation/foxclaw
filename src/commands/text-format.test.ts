import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("foxclaw", 16)).toBe("foxclaw");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("foxclaw-status-output", 10)).toBe("foxclaw-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
