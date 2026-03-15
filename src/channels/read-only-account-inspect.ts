import {
  inspectSlackAccount,
  type InspectedSlackAccount,
} from "../../extensions/slack/src/account-inspect.js";
import type { OpenClawConfig } from "../config/config.js";
import type { ChannelId } from "./plugins/types.js";

export type ReadOnlyInspectedAccount = InspectedSlackAccount;

export function inspectReadOnlyChannelAccount(params: {
  channelId: ChannelId;
  cfg: OpenClawConfig;
  accountId?: string | null;
}): ReadOnlyInspectedAccount | null {
  if (params.channelId === "slack") {
    return inspectSlackAccount({
      cfg: params.cfg,
      accountId: params.accountId,
    });
  }
  return null;
}
