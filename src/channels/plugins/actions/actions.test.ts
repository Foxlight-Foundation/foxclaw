import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FoxClawConfig } from "../../../config/config.js";

const handleSlackAction = vi.fn(async (..._args: unknown[]) => ({ details: { ok: true } }));

vi.mock("../../../agents/tools/slack-actions.js", () => ({
  handleSlackAction,
}));

const { createSlackActions } = await import("../slack.actions.js");

function slackHarness() {
  const cfg = { channels: { slack: { botToken: "tok" } } } as FoxClawConfig;
  const actions = createSlackActions("slack");
  return { cfg, actions };
}

type SlackActionInput = Parameters<
  NonNullable<ReturnType<typeof createSlackActions>["handleAction"]>
>[0];

async function runSlackAction(
  action: SlackActionInput["action"],
  params: SlackActionInput["params"],
) {
  const { cfg, actions } = slackHarness();
  await actions.handleAction?.({
    channel: "slack",
    action,
    cfg,
    params,
  });
  return { cfg, actions };
}

function expectFirstSlackAction(expected: Record<string, unknown>) {
  const [params] = handleSlackAction.mock.calls[0] ?? [];
  expect(params).toMatchObject(expected);
}

async function expectSlackSendRejected(params: Record<string, unknown>, error: RegExp) {
  const { cfg, actions } = slackHarness();
  await expect(
    actions.handleAction?.({
      channel: "slack",
      action: "send",
      cfg,
      params,
    }),
  ).rejects.toThrow(error);
  expect(handleSlackAction).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("slack actions adapter", () => {
  it("forwards threadId for read", async () => {
    await runSlackAction("read", {
      channelId: "C1",
      threadId: "171234.567",
    });

    expectFirstSlackAction({
      action: "readMessages",
      channelId: "C1",
      threadId: "171234.567",
    });
  });

  it("forwards normalized limit for emoji-list", async () => {
    await runSlackAction("emoji-list", {
      limit: "2.9",
    });

    expectFirstSlackAction({
      action: "emojiList",
      limit: 2,
    });
  });

  it("forwards blocks for send/edit actions", async () => {
    const cases = [
      {
        action: "send" as const,
        params: {
          to: "channel:C1",
          message: "",
          blocks: JSON.stringify([{ type: "divider" }]),
        },
        expected: {
          action: "sendMessage",
          to: "channel:C1",
          content: "",
          blocks: [{ type: "divider" }],
        },
      },
      {
        action: "send" as const,
        params: {
          to: "channel:C1",
          message: "",
          blocks: [{ type: "section", text: { type: "mrkdwn", text: "hi" } }],
        },
        expected: {
          action: "sendMessage",
          to: "channel:C1",
          content: "",
          blocks: [{ type: "section", text: { type: "mrkdwn", text: "hi" } }],
        },
      },
      {
        action: "edit" as const,
        params: {
          channelId: "C1",
          messageId: "171234.567",
          message: "",
          blocks: JSON.stringify([{ type: "divider" }]),
        },
        expected: {
          action: "editMessage",
          channelId: "C1",
          messageId: "171234.567",
          content: "",
          blocks: [{ type: "divider" }],
        },
      },
      {
        action: "edit" as const,
        params: {
          channelId: "C1",
          messageId: "171234.567",
          message: "",
          blocks: [{ type: "section", text: { type: "mrkdwn", text: "updated" } }],
        },
        expected: {
          action: "editMessage",
          channelId: "C1",
          messageId: "171234.567",
          content: "",
          blocks: [{ type: "section", text: { type: "mrkdwn", text: "updated" } }],
        },
      },
    ] as const;

    for (const testCase of cases) {
      handleSlackAction.mockClear();
      await runSlackAction(testCase.action, testCase.params);
      expectFirstSlackAction(testCase.expected);
    }
  });

  it("rejects invalid send block combinations before dispatch", async () => {
    const cases = [
      {
        name: "invalid JSON",
        params: {
          to: "channel:C1",
          message: "",
          blocks: "{bad-json",
        },
        error: /blocks must be valid JSON/i,
      },
      {
        name: "empty blocks",
        params: {
          to: "channel:C1",
          message: "",
          blocks: "[]",
        },
        error: /at least one block/i,
      },
      {
        name: "blocks with media",
        params: {
          to: "channel:C1",
          message: "",
          media: "https://example.com/image.png",
          blocks: JSON.stringify([{ type: "divider" }]),
        },
        error: /does not support blocks with media/i,
      },
    ] as const;

    for (const testCase of cases) {
      handleSlackAction.mockClear();
      await expectSlackSendRejected(testCase.params, testCase.error);
    }
  });

  it("rejects edit when both message and blocks are missing", async () => {
    const { cfg, actions } = slackHarness();

    await expect(
      actions.handleAction?.({
        channel: "slack",
        action: "edit",
        cfg,
        params: {
          channelId: "C1",
          messageId: "171234.567",
          message: "",
        },
      }),
    ).rejects.toThrow(/edit requires message or blocks/i);
    expect(handleSlackAction).not.toHaveBeenCalled();
  });
});
