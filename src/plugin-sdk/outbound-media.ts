import { loadWebMedia } from "../media/web-media.js";

export type OutboundMediaLoadOptions = {
  maxBytes?: number;
  mediaLocalRoots?: readonly string[];
};

export const loadOutboundMediaFromUrl = async (
  mediaUrl: string,
  options: OutboundMediaLoadOptions = {},
) => {
  return await loadWebMedia(mediaUrl, {
    maxBytes: options.maxBytes,
    localRoots: options.mediaLocalRoots,
  });
};
