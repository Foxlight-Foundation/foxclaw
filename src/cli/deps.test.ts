import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultDeps } from "./deps.js";

const moduleLoads = vi.hoisted(() => ({
  slack: vi.fn(),
}));

const sendFns = vi.hoisted(() => ({
  slack: vi.fn(async () => ({ messageId: "s1", channelId: "slack:1" })),
}));

vi.mock("../../extensions/slack/src/send.js", () => {
  moduleLoads.slack();
  return { sendMessageSlack: sendFns.slack };
});

describe("createDefaultDeps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not load provider modules until a dependency is used", async () => {
    const deps = createDefaultDeps();

    expect(moduleLoads.slack).not.toHaveBeenCalled();

    const sendSlack = deps["slack"] as (...args: unknown[]) => Promise<unknown>;
    await sendSlack("channel", "hello", { verbose: false });

    expect(moduleLoads.slack).toHaveBeenCalledTimes(1);
    expect(sendFns.slack).toHaveBeenCalledTimes(1);
  });

  it("reuses send function across multiple calls", async () => {
    const deps = createDefaultDeps();
    const sendSlack = deps["slack"] as (...args: unknown[]) => Promise<unknown>;

    await sendSlack("channel", "first", { verbose: false });
    await sendSlack("channel", "second", { verbose: false });

    expect(sendFns.slack).toHaveBeenCalledTimes(2);
  });
});
