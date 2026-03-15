import type { OutboundSendDeps } from "../infra/outbound/send-deps.js";
import { createOutboundSendDepsFromCliSource } from "./outbound-send-mapping.js";

/**
 * Lazy-loaded per-channel send functions, keyed by channel ID.
 * Values are proxy functions that dynamically import the real module on first use.
 */
export type CliDeps = { [channelId: string]: unknown };

// Per-channel module caches for lazy loading.
const senderCache = new Map<string, Promise<Record<string, unknown>>>();

/**
 * Create a lazy-loading send function proxy for a channel.
 * The channel's module is loaded on first call and cached for reuse.
 */
function createLazySender(
  channelId: string,
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
): (...args: unknown[]) => Promise<unknown> {
  return async (...args: unknown[]) => {
    let cached = senderCache.get(channelId);
    if (!cached) {
      cached = loader();
      senderCache.set(channelId, cached);
    }
    const mod = await cached;
    const fn = mod[exportName] as (...a: unknown[]) => Promise<unknown>;
    return await fn(...args);
  };
}

export function createDefaultDeps(): CliDeps {
  return {
    slack: createLazySender(
      "slack",
      () => import("../../extensions/slack/src/send.js") as Promise<Record<string, unknown>>,
      "sendMessageSlack",
    ),
  };
}

export function createOutboundSendDeps(deps: CliDeps): OutboundSendDeps {
  return createOutboundSendDepsFromCliSource(deps);
}

