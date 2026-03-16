import "./isolated-agent.mocks.js";
import fs from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runSubagentAnnounceFlow } from "../agents/subagent-announce.js";
import type { CliDeps } from "../cli/deps.js";
import {
  createCliDeps,
  expectDirectSlackDelivery,
  mockAgentPayloads,
  runSlackAnnounceTurn,
} from "./isolated-agent.delivery.test-helpers.js";
import { runCronIsolatedAgentTurn } from "./isolated-agent.js";
import {
  makeCfg,
  makeJob,
  withTempCronHome as withTempHome,
  writeSessionStore,
} from "./isolated-agent.test-harness.js";
import { setupIsolatedAgentTurnMocks } from "./isolated-agent.test-setup.js";

const SLACK_TARGET = { mode: "announce", channel: "slack", to: "C123" } as const;
async function runExplicitSlackAnnounceTurn(params: {
  home: string;
  storePath: string;
  deps: CliDeps;
  deliveryContract?: "cron-owned" | "shared";
}): Promise<Awaited<ReturnType<typeof runCronIsolatedAgentTurn>>> {
  return runSlackAnnounceTurn({
    ...params,
    delivery: SLACK_TARGET,
  });
}

async function withSlackAnnounceFixture(
  run: (params: { home: string; storePath: string; deps: CliDeps }) => Promise<void>,
  params?: {
    deps?: Partial<CliDeps>;
    sessionStore?: { lastProvider?: string; lastTo?: string };
  },
): Promise<void> {
  await withTempHome(async (home) => {
    const storePath = await writeSessionStore(home, {
      lastProvider: params?.sessionStore?.lastProvider ?? "webchat",
      lastTo: params?.sessionStore?.lastTo ?? "",
    });
    const deps = createCliDeps(params?.deps);
    await run({ home, storePath, deps });
  });
}

function expectDeliveredOk(result: Awaited<ReturnType<typeof runCronIsolatedAgentTurn>>): void {
  expect(result.status).toBe("ok");
  expect(result.delivered).toBe(true);
}

async function expectBestEffortSlackNotDelivered(payload: Record<string, unknown>): Promise<void> {
  await expectStructuredSlackFailure({
    payload,
    bestEffort: true,
    expectedStatus: "ok",
    expectDeliveryAttempted: true,
  });
}

async function expectStructuredSlackFailure(params: {
  payload: Record<string, unknown>;
  bestEffort: boolean;
  expectedStatus: "ok" | "error";
  expectedErrorFragment?: string;
  expectDeliveryAttempted?: boolean;
}): Promise<void> {
  await withSlackAnnounceFixture(
    async ({ home, storePath, deps }) => {
      mockAgentPayloads([params.payload]);
      const res = await runSlackAnnounceTurn({
        home,
        storePath,
        deps,
        delivery: {
          ...SLACK_TARGET,
          ...(params.bestEffort ? { bestEffort: true } : {}),
        },
      });

      expectFailedSlackDeliveryResult({
        res,
        deps,
        expectedStatus: params.expectedStatus,
        expectedErrorFragment: params.expectedErrorFragment,
        expectDeliveryAttempted: params.expectDeliveryAttempted,
      });
    },
    {
      deps: {
        sendMessageSlack: vi.fn().mockRejectedValue(new Error("boom")),
      },
    },
  );
}

function expectFailedSlackDeliveryResult(params: {
  res: Awaited<ReturnType<typeof runCronIsolatedAgentTurn>>;
  deps: CliDeps;
  expectedStatus: "ok" | "error";
  expectedErrorFragment?: string;
  expectDeliveryAttempted?: boolean;
}) {
  expect(params.res.status).toBe(params.expectedStatus);
  if (params.expectedStatus === "ok") {
    expect(params.res.delivered).toBe(false);
  } else {
    expect(params.res.delivered).toBeUndefined();
  }
  if (params.expectDeliveryAttempted !== undefined) {
    expect(params.res.deliveryAttempted).toBe(params.expectDeliveryAttempted);
  }
  if (params.expectedErrorFragment) {
    expect(params.res.error).toContain(params.expectedErrorFragment);
  }
  expect(runSubagentAnnounceFlow).not.toHaveBeenCalled();
  expect(params.deps.sendMessageSlack).toHaveBeenCalledTimes(1);
}

async function runSlackDeliveryResult(bestEffort: boolean) {
  let outcome:
    | {
        res: Awaited<ReturnType<typeof runCronIsolatedAgentTurn>>;
        deps: CliDeps;
      }
    | undefined;
  await withSlackTextDelivery({ bestEffort }, async ({ res, deps }) => {
    outcome = { res, deps };
  });
  if (!outcome) {
    throw new Error("slack delivery did not produce an outcome");
  }
  return outcome;
}

function expectSuccessfulSlackTextDelivery(params: {
  res: Awaited<ReturnType<typeof runCronIsolatedAgentTurn>>;
  deps: CliDeps;
}): void {
  expect(params.res.status).toBe("ok");
  expect(params.res.delivered).toBe(true);
  expect(params.res.deliveryAttempted).toBe(true);
  expect(runSubagentAnnounceFlow).not.toHaveBeenCalled();
}

async function withSlackTextDelivery(
  params: { bestEffort: boolean },
  run: (params: {
    home: string;
    storePath: string;
    deps: CliDeps;
    res: Awaited<ReturnType<typeof runCronIsolatedAgentTurn>>;
  }) => Promise<void>,
  fixtureParams?: Parameters<typeof withSlackAnnounceFixture>[1],
) {
  await withSlackAnnounceFixture(async ({ home, storePath, deps }) => {
    mockAgentPayloads([{ text: "hello from cron" }]);
    const res = await runSlackAnnounceTurn({
      home,
      storePath,
      deps,
      delivery: {
        mode: "announce",
        channel: "slack",
        to: "C123",
        bestEffort: params.bestEffort,
      },
    });
    await run({ home, storePath, deps, res });
  }, fixtureParams);
}

async function expectSlackTextDeliveryFailure(params: {
  bestEffort: boolean;
  expectedStatus: "ok" | "error";
  expectedErrorFragment?: string;
}) {
  await withSlackTextDelivery(
    { bestEffort: params.bestEffort },
    async ({ deps, res }) => {
      expectFailedSlackDeliveryResult({
        res,
        deps,
        expectedStatus: params.expectedStatus,
        expectedErrorFragment: params.expectedErrorFragment,
        expectDeliveryAttempted: true,
      });
    },
    {
      deps: {
        sendMessageSlack: vi.fn().mockRejectedValue(new Error("boom")),
      },
    },
  );
}

async function assertExplicitSlackTargetDelivery(params: {
  home: string;
  storePath: string;
  deps: CliDeps;
  payloads: Array<Record<string, unknown>>;
  expectedText: string;
}): Promise<void> {
  mockAgentPayloads(params.payloads);
  const res = await runExplicitSlackAnnounceTurn({
    home: params.home,
    storePath: params.storePath,
    deps: params.deps,
  });

  expectDeliveredOk(res);
  expect(runSubagentAnnounceFlow).not.toHaveBeenCalled();
  expectDirectSlackDelivery(params.deps, {
    to: "C123",
    text: params.expectedText,
  });
}

describe("runCronIsolatedAgentTurn", () => {
  beforeEach(() => {
    setupIsolatedAgentTurnMocks();
  });

  it("delivers explicit targets with direct text", async () => {
    await withSlackAnnounceFixture(async ({ home, storePath, deps }) => {
      await assertExplicitSlackTargetDelivery({
        home,
        storePath,
        deps,
        payloads: [{ text: "hello from cron" }],
        expectedText: "hello from cron",
      });
    });
  });

  it("delivers explicit targets with final-payload text", async () => {
    await withSlackAnnounceFixture(async ({ home, storePath, deps }) => {
      await assertExplicitSlackTargetDelivery({
        home,
        storePath,
        deps,
        payloads: [{ text: "Working on it..." }, { text: "Final weather summary" }],
        expectedText: "Final weather summary",
      });
    });
  });

  it("delivers explicit targets directly with per-channel-peer session scoping", async () => {
    await withSlackAnnounceFixture(async ({ home, storePath, deps }) => {
      mockAgentPayloads([{ text: "hello from cron" }]);

      const res = await runCronIsolatedAgentTurn({
        cfg: makeCfg(home, storePath, {
          session: {
            store: storePath,
            mainKey: "main",
            dmScope: "per-channel-peer",
          },
          channels: {
            slack: { botToken: "xoxb-1" },
          },
        }),
        deps,
        job: {
          ...makeJob({ kind: "agentTurn", message: "do it" }),
          delivery: { mode: "announce", channel: "slack", to: "C123" },
        },
        message: "do it",
        sessionKey: "cron:job-1",
        lane: "cron",
      });

      expectDeliveredOk(res);
      expect(runSubagentAnnounceFlow).not.toHaveBeenCalled();
      expectDirectSlackDelivery(deps, {
        to: "C123",
        text: "hello from cron",
      });
    });
  });

  it("routes threaded announce targets through direct delivery", async () => {
    await withTempHome(async (home) => {
      const storePath = await writeSessionStore(home, { lastProvider: "webchat", lastTo: "" });
      await fs.writeFile(
        storePath,
        JSON.stringify(
          {
            "agent:main:main": {
              sessionId: "main-session",
              updatedAt: Date.now(),
              lastChannel: "slack",
              lastTo: "C123",
              lastThreadId: "1234567890.123456",
            },
          },
          null,
          2,
        ),
        "utf-8",
      );
      const deps = createCliDeps();
      mockAgentPayloads([{ text: "Final weather summary" }]);
      const res = await runSlackAnnounceTurn({
        home,
        storePath,
        deps,
        delivery: { mode: "announce", channel: "last" },
      });

      expect(res.status).toBe("ok");
      expect(res.delivered).toBe(true);
      expect(runSubagentAnnounceFlow).not.toHaveBeenCalled();
      expectDirectSlackDelivery(deps, {
        to: "C123",
        text: "Final weather summary",
      });
    });
  });

  it("skips announce when messaging tool already sent to target", async () => {
    await withSlackAnnounceFixture(async ({ home, storePath, deps }) => {
      mockAgentPayloads([{ text: "sent" }], {
        didSendViaMessagingTool: true,
        messagingToolSentTargets: [{ tool: "message", provider: "slack", to: "C123" }],
      });

      const res = await runExplicitSlackAnnounceTurn({
        home,
        storePath,
        deps,
        deliveryContract: "shared",
      });

      expectDeliveredOk(res);
      expect(runSubagentAnnounceFlow).not.toHaveBeenCalled();
      expect(deps.sendMessageSlack).not.toHaveBeenCalled();
    });
  });

  it("reports not-delivered when best-effort structured outbound sends all fail", async () => {
    await expectBestEffortSlackNotDelivered({
      text: "caption",
      mediaUrl: "https://example.com/img.png",
    });
  });

  it("skips announce for heartbeat-only output", async () => {
    await withSlackAnnounceFixture(async ({ home, storePath, deps }) => {
      mockAgentPayloads([{ text: "HEARTBEAT_OK" }]);
      const res = await runSlackAnnounceTurn({
        home,
        storePath,
        deps,
        delivery: { mode: "announce", channel: "slack", to: "C123" },
      });

      expect(res.status).toBe("ok");
      expect(runSubagentAnnounceFlow).not.toHaveBeenCalled();
      expect(deps.sendMessageSlack).not.toHaveBeenCalled();
    });
  });

  it("fails when structured direct delivery fails and best-effort is disabled", async () => {
    await expectStructuredSlackFailure({
      payload: { text: "hello from cron", mediaUrl: "https://example.com/img.png" },
      bestEffort: false,
      expectedStatus: "error",
      expectedErrorFragment: "boom",
    });
  });

  it("reports not-delivered when text direct delivery fails and best-effort is enabled", async () => {
    await expectSlackTextDeliveryFailure({
      bestEffort: true,
      expectedStatus: "ok",
    });
  });

  it("delivers text directly when best-effort is disabled", async () => {
    const { res, deps } = await runSlackDeliveryResult(false);
    expectSuccessfulSlackTextDelivery({ res, deps });
    expectDirectSlackDelivery(deps, {
      to: "C123",
      text: "hello from cron",
    });
  });

  it("returns error when text direct delivery fails and best-effort is disabled", async () => {
    await expectSlackTextDeliveryFailure({
      bestEffort: false,
      expectedStatus: "error",
      expectedErrorFragment: "boom",
    });
  });

  it("retries transient text direct delivery failures before succeeding", async () => {
    const previousFastMode = process.env.FOXCLAW_TEST_FAST;
    process.env.FOXCLAW_TEST_FAST = "1";
    try {
      await withSlackTextDelivery(
        { bestEffort: false },
        async ({ deps, res }) => {
          expectSuccessfulSlackTextDelivery({ res, deps });
          expect(deps.sendMessageSlack).toHaveBeenCalledTimes(2);
          expect(deps.sendMessageSlack).toHaveBeenLastCalledWith(
            "C123",
            "hello from cron",
            expect.objectContaining({ cfg: expect.any(Object) }),
          );
        },
        {
          deps: {
            sendMessageSlack: vi
              .fn()
              .mockRejectedValueOnce(new Error("UNAVAILABLE: temporary network error"))
              .mockResolvedValue({ messageTs: "slack-2", channel: "C123" }),
          },
        },
      );
    } finally {
      if (previousFastMode === undefined) {
        delete process.env.FOXCLAW_TEST_FAST;
      } else {
        process.env.FOXCLAW_TEST_FAST = previousFastMode;
      }
    }
  });

  it("delivers text directly when best-effort is enabled", async () => {
    const { res, deps } = await runSlackDeliveryResult(true);
    expectSuccessfulSlackTextDelivery({ res, deps });
    expectDirectSlackDelivery(deps, {
      to: "C123",
      text: "hello from cron",
    });
  });

  it("ignores structured direct delivery failures when best-effort is enabled", async () => {
    await expectBestEffortSlackNotDelivered({
      text: "hello from cron",
      mediaUrl: "https://example.com/img.png",
    });
  });
});
