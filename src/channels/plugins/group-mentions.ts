import { inspectSlackAccount } from "../../../extensions/slack/src/account-inspect.js";
import type { OpenClawConfig } from "../../config/config.js";
import {
  resolveChannelGroupRequireMention,
  resolveChannelGroupToolsPolicy,
  resolveToolsBySender,
} from "../../config/group-policy.js";
import type {
  GroupToolPolicyBySenderConfig,
  GroupToolPolicyConfig,
} from "../../config/types.tools.js";
import { normalizeHyphenSlug } from "../../shared/string-normalization.js";
import type { ChannelGroupContext } from "./types.js";

type GroupMentionParams = ChannelGroupContext;

type SlackChannelPolicyEntry = {
  requireMention?: boolean;
  tools?: GroupToolPolicyConfig;
  toolsBySender?: GroupToolPolicyBySenderConfig;
};

type SenderScopedToolsEntry = {
  tools?: GroupToolPolicyConfig;
  toolsBySender?: GroupToolPolicyBySenderConfig;
};

function resolveSlackChannelPolicyEntry(
  params: GroupMentionParams,
): SlackChannelPolicyEntry | undefined {
  const account = inspectSlackAccount({
    cfg: params.cfg,
    accountId: params.accountId,
  });
  const channels = (account.channels ?? {}) as Record<string, SlackChannelPolicyEntry>;
  if (Object.keys(channels).length === 0) {
    return undefined;
  }
  const channelId = params.groupId?.trim();
  const groupChannel = params.groupChannel;
  const channelName = groupChannel?.replace(/^#/, "");
  const normalizedName = normalizeHyphenSlug(channelName);
  const candidates = [
    channelId ?? "",
    channelName ? `#${channelName}` : "",
    channelName ?? "",
    normalizedName,
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate && channels[candidate]) {
      return channels[candidate];
    }
  }
  return channels["*"];
}

function resolveSenderToolsEntry(
  entry: SenderScopedToolsEntry | undefined | null,
  params: GroupMentionParams,
): GroupToolPolicyConfig | undefined {
  if (!entry) {
    return undefined;
  }
  const senderPolicy = resolveToolsBySender({
    toolsBySender: entry.toolsBySender,
    senderId: params.senderId,
    senderName: params.senderName,
    senderUsername: params.senderUsername,
    senderE164: params.senderE164,
  });
  if (senderPolicy) {
    return senderPolicy;
  }
  return entry.tools;
}

export function resolveSlackGroupRequireMention(params: GroupMentionParams): boolean {
  const resolved = resolveSlackChannelPolicyEntry(params);
  if (typeof resolved?.requireMention === "boolean") {
    return resolved.requireMention;
  }
  return true;
}

export function resolveSlackGroupToolPolicy(
  params: GroupMentionParams,
): GroupToolPolicyConfig | undefined {
  const resolved = resolveSlackChannelPolicyEntry(params);
  return resolveSenderToolsEntry(resolved, params);
}
