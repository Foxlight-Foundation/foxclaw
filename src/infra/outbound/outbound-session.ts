import { resolveSlackAccount } from "../../../extensions/slack/src/accounts.js";
import { createSlackWebClient } from "../../../extensions/slack/src/client.js";
import { normalizeAllowListLower } from "../../../extensions/slack/src/monitor/allow-list.js";
import { parseSlackTarget } from "../../../extensions/slack/src/targets.js";
import type { MsgContext } from "../../auto-reply/templating.js";
import type { ChatType } from "../../channels/chat-type.js";
import { getChannelPlugin } from "../../channels/plugins/index.js";
import type { ChannelId } from "../../channels/plugins/types.js";
import type { FoxClawConfig } from "../../config/config.js";
import { recordSessionMetaFromInbound, resolveStorePath } from "../../config/sessions.js";
import { buildAgentSessionKey, type RoutePeer } from "../../routing/resolve-route.js";
import { resolveThreadSessionKeys } from "../../routing/session-key.js";
import type { ResolvedMessagingTarget } from "./target-resolver.js";

export type OutboundSessionRoute = {
  sessionKey: string;
  baseSessionKey: string;
  peer: RoutePeer;
  chatType: "direct" | "group" | "channel";
  from: string;
  to: string;
  threadId?: string | number;
};

export type ResolveOutboundSessionRouteParams = {
  cfg: FoxClawConfig;
  channel: ChannelId;
  agentId: string;
  accountId?: string | null;
  target: string;
  resolvedTarget?: ResolvedMessagingTarget;
  replyToId?: string | null;
  threadId?: string | number | null;
};

// Cache Slack channel type lookups to avoid repeated API calls.
const SLACK_CHANNEL_TYPE_CACHE = new Map<string, "channel" | "group" | "dm" | "unknown">();

function normalizeThreadId(value?: string | number | null): string | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return String(Math.trunc(value));
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function stripProviderPrefix(raw: string, channel: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  const prefix = `${channel.toLowerCase()}:`;
  if (lower.startsWith(prefix)) {
    return trimmed.slice(prefix.length).trim();
  }
  return trimmed;
}

function stripKindPrefix(raw: string): string {
  return raw.replace(/^(user|channel|group|conversation|room|dm):/i, "").trim();
}

function inferPeerKind(params: {
  channel: ChannelId;
  resolvedTarget?: ResolvedMessagingTarget;
}): ChatType {
  const resolvedKind = params.resolvedTarget?.kind;
  if (resolvedKind === "user") {
    return "direct";
  }
  if (resolvedKind === "channel") {
    return "channel";
  }
  if (resolvedKind === "group") {
    const plugin = getChannelPlugin(params.channel);
    const chatTypes = plugin?.capabilities?.chatTypes ?? [];
    const supportsChannel = chatTypes.includes("channel");
    const supportsGroup = chatTypes.includes("group");
    if (supportsChannel && !supportsGroup) {
      return "channel";
    }
    return "group";
  }
  return "direct";
}

function buildBaseSessionKey(params: {
  cfg: FoxClawConfig;
  agentId: string;
  channel: ChannelId;
  accountId?: string | null;
  peer: RoutePeer;
}): string {
  return buildAgentSessionKey({
    agentId: params.agentId,
    channel: params.channel,
    accountId: params.accountId,
    peer: params.peer,
    dmScope: params.cfg.session?.dmScope ?? "main",
    identityLinks: params.cfg.session?.identityLinks,
  });
}

// Best-effort mpim detection: allowlist/config, then Slack API (if token available).
async function resolveSlackChannelType(params: {
  cfg: FoxClawConfig;
  accountId?: string | null;
  channelId: string;
}): Promise<"channel" | "group" | "dm" | "unknown"> {
  const channelId = params.channelId.trim();
  if (!channelId) {
    return "unknown";
  }
  const cached = SLACK_CHANNEL_TYPE_CACHE.get(`${params.accountId ?? "default"}:${channelId}`);
  if (cached) {
    return cached;
  }

  const account = resolveSlackAccount({ cfg: params.cfg, accountId: params.accountId });
  const groupChannels = normalizeAllowListLower(account.dm?.groupChannels);
  const channelIdLower = channelId.toLowerCase();
  if (
    groupChannels.includes(channelIdLower) ||
    groupChannels.includes(`slack:${channelIdLower}`) ||
    groupChannels.includes(`channel:${channelIdLower}`) ||
    groupChannels.includes(`group:${channelIdLower}`) ||
    groupChannels.includes(`mpim:${channelIdLower}`)
  ) {
    SLACK_CHANNEL_TYPE_CACHE.set(`${account.accountId}:${channelId}`, "group");
    return "group";
  }

  const channelKeys = Object.keys(account.channels ?? {});
  if (
    channelKeys.some((key) => {
      const normalized = key.trim().toLowerCase();
      return (
        normalized === channelIdLower ||
        normalized === `channel:${channelIdLower}` ||
        normalized.replace(/^#/, "") === channelIdLower
      );
    })
  ) {
    SLACK_CHANNEL_TYPE_CACHE.set(`${account.accountId}:${channelId}`, "channel");
    return "channel";
  }

  const token = account.botToken?.trim() || account.userToken || "";
  if (!token) {
    SLACK_CHANNEL_TYPE_CACHE.set(`${account.accountId}:${channelId}`, "unknown");
    return "unknown";
  }

  try {
    const client = createSlackWebClient(token);
    const info = await client.conversations.info({ channel: channelId });
    const channel = info.channel as { is_im?: boolean; is_mpim?: boolean } | undefined;
    const type = channel?.is_im ? "dm" : channel?.is_mpim ? "group" : "channel";
    SLACK_CHANNEL_TYPE_CACHE.set(`${account.accountId}:${channelId}`, type);
    return type;
  } catch {
    SLACK_CHANNEL_TYPE_CACHE.set(`${account.accountId}:${channelId}`, "unknown");
    return "unknown";
  }
}

async function resolveSlackSession(
  params: ResolveOutboundSessionRouteParams,
): Promise<OutboundSessionRoute | null> {
  const parsed = parseSlackTarget(params.target, { defaultKind: "channel" });
  if (!parsed) {
    return null;
  }
  const isDm = parsed.kind === "user";
  let peerKind: ChatType = isDm ? "direct" : "channel";
  if (!isDm && /^G/i.test(parsed.id)) {
    // Slack mpim/group DMs share the G-prefix; detect to align session keys with inbound.
    const channelType = await resolveSlackChannelType({
      cfg: params.cfg,
      accountId: params.accountId,
      channelId: parsed.id,
    });
    if (channelType === "group") {
      peerKind = "group";
    }
    if (channelType === "dm") {
      peerKind = "direct";
    }
  }
  const peer: RoutePeer = {
    kind: peerKind,
    id: parsed.id,
  };
  const baseSessionKey = buildBaseSessionKey({
    cfg: params.cfg,
    agentId: params.agentId,
    channel: "slack",
    accountId: params.accountId,
    peer,
  });
  const threadId = normalizeThreadId(params.threadId ?? params.replyToId);
  const threadKeys = resolveThreadSessionKeys({
    baseSessionKey,
    threadId,
  });
  return {
    sessionKey: threadKeys.sessionKey,
    baseSessionKey,
    peer,
    chatType: peerKind === "direct" ? "direct" : "channel",
    from:
      peerKind === "direct"
        ? `slack:${parsed.id}`
        : peerKind === "group"
          ? `slack:group:${parsed.id}`
          : `slack:channel:${parsed.id}`,
    to: peerKind === "direct" ? `user:${parsed.id}` : `channel:${parsed.id}`,
    threadId,
  };
}

function buildSimpleBaseSession(params: {
  route: ResolveOutboundSessionRouteParams;
  channel: string;
  peer: RoutePeer;
}) {
  const baseSessionKey = buildBaseSessionKey({
    cfg: params.route.cfg,
    agentId: params.route.agentId,
    channel: params.channel,
    accountId: params.route.accountId,
    peer: params.peer,
  });
  return { baseSessionKey, peer: params.peer };
}

function resolveFallbackSession(
  params: ResolveOutboundSessionRouteParams,
): OutboundSessionRoute | null {
  const trimmed = stripProviderPrefix(params.target, params.channel).trim();
  if (!trimmed) {
    return null;
  }
  const peerKind = inferPeerKind({
    channel: params.channel,
    resolvedTarget: params.resolvedTarget,
  });
  const peerId = stripKindPrefix(trimmed);
  if (!peerId) {
    return null;
  }
  const peer: RoutePeer = { kind: peerKind, id: peerId };
  const baseSessionKey = buildBaseSessionKey({
    cfg: params.cfg,
    agentId: params.agentId,
    channel: params.channel,
    peer,
  });
  const chatType = peerKind === "direct" ? "direct" : peerKind === "channel" ? "channel" : "group";
  const from =
    peerKind === "direct"
      ? `${params.channel}:${peerId}`
      : `${params.channel}:${peerKind}:${peerId}`;
  const toPrefix = peerKind === "direct" ? "user" : "channel";
  return {
    sessionKey: baseSessionKey,
    baseSessionKey,
    peer,
    chatType,
    from,
    to: `${toPrefix}:${peerId}`,
  };
}

type OutboundSessionResolver = (
  params: ResolveOutboundSessionRouteParams,
) => OutboundSessionRoute | null | Promise<OutboundSessionRoute | null>;

const OUTBOUND_SESSION_RESOLVERS: Partial<Record<ChannelId, OutboundSessionResolver>> = {
  slack: resolveSlackSession,
};

export async function resolveOutboundSessionRoute(
  params: ResolveOutboundSessionRouteParams,
): Promise<OutboundSessionRoute | null> {
  const target = params.target.trim();
  if (!target) {
    return null;
  }
  const nextParams = { ...params, target };
  const resolver = OUTBOUND_SESSION_RESOLVERS[params.channel];
  if (!resolver) {
    return resolveFallbackSession(nextParams);
  }
  return await resolver(nextParams);
}

export async function ensureOutboundSessionEntry(params: {
  cfg: FoxClawConfig;
  agentId: string;
  channel: ChannelId;
  accountId?: string | null;
  route: OutboundSessionRoute;
}): Promise<void> {
  const storePath = resolveStorePath(params.cfg.session?.store, {
    agentId: params.agentId,
  });
  const ctx: MsgContext = {
    From: params.route.from,
    To: params.route.to,
    SessionKey: params.route.sessionKey,
    AccountId: params.accountId ?? undefined,
    ChatType: params.route.chatType,
    Provider: params.channel,
    Surface: params.channel,
    MessageThreadId: params.route.threadId,
    OriginatingChannel: params.channel,
    OriginatingTo: params.route.to,
  };
  try {
    await recordSessionMetaFromInbound({
      storePath,
      sessionKey: params.route.sessionKey,
      ctx,
    });
  } catch {
    // Do not block outbound sends on session meta writes.
  }
}
