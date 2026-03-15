import type { ChannelId } from "../../channels/plugins/types.js";
import type { FoxClawConfig } from "../../config/config.js";

/** Opaque rich-component array for channels that support structured message components. */
// oxlint-disable-next-line typescript/no-explicit-any
type ChannelComponents = any[];

export type CrossContextComponentsBuilder = (message: string) => ChannelComponents[];

export type CrossContextComponentsFactory = (params: {
  originLabel: string;
  message: string;
  cfg: FoxClawConfig;
  accountId?: string | null;
}) => ChannelComponents[];

export type ChannelMessageAdapter = {
  supportsComponentsV2: boolean;
  buildCrossContextComponents?: CrossContextComponentsFactory;
};

const DEFAULT_ADAPTER: ChannelMessageAdapter = {
  supportsComponentsV2: false,
};

export function getChannelMessageAdapter(_channel: ChannelId): ChannelMessageAdapter {
  return DEFAULT_ADAPTER;
}
