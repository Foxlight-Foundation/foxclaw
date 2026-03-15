import { expect, vi } from "vitest";
import { runEmbeddedPiAgent } from "../agents/pi-embedded.js";
import type { CliDeps } from "../cli/deps.js";
import { runCronIsolatedAgentTurn } from "./isolated-agent.js";
import { makeCfg, makeJob } from "./isolated-agent.test-harness.js";

export function createCliDeps(overrides: Partial<CliDeps> = {}): CliDeps {
  return {
    sendMessageSlack: vi.fn().mockResolvedValue({ messageTs: "slack-1", channel: "C1" }),
    ...overrides,
  };
}

export function mockAgentPayloads(
  payloads: Array<Record<string, unknown>>,
  extra: Partial<Awaited<ReturnType<typeof runEmbeddedPiAgent>>> = {},
): void {
  vi.mocked(runEmbeddedPiAgent).mockResolvedValue({
    payloads,
    meta: {
      durationMs: 5,
      agentMeta: { sessionId: "s", provider: "p", model: "m" },
    },
    ...extra,
  });
}

export function expectDirectSlackDelivery(
  deps: CliDeps,
  params: { to: string; text: string },
) {
  expect(deps.sendMessageSlack).toHaveBeenCalledTimes(1);
  expect(deps.sendMessageSlack).toHaveBeenCalledWith(
    params.to,
    params.text,
    expect.objectContaining({}),
  );
}

export async function runSlackAnnounceTurn(params: {
  home: string;
  storePath: string;
  deps: CliDeps;
  delivery: {
    mode: "announce";
    channel: string;
    to?: string;
    bestEffort?: boolean;
  };
  deliveryContract?: "cron-owned" | "shared";
}): Promise<Awaited<ReturnType<typeof runCronIsolatedAgentTurn>>> {
  return runCronIsolatedAgentTurn({
    cfg: makeCfg(params.home, params.storePath, {
      channels: { slack: { botToken: "xoxb-1" } },
    }),
    deps: params.deps,
    job: {
      ...makeJob({ kind: "agentTurn", message: "do it" }),
      delivery: params.delivery,
    },
    message: "do it",
    sessionKey: "cron:job-1",
    lane: "cron",
    deliveryContract: params.deliveryContract,
  });
}

