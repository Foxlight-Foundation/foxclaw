import type { FoxClawConfig } from "../config/config.js";
import { applyAgentDefaultPrimaryModel } from "./model-default.js";

export const OPENCODE_GO_DEFAULT_MODEL_REF = "opencode-go/kimi-k2.5";

export function applyOpencodeGoModelDefault(cfg: FoxClawConfig): {
  next: FoxClawConfig;
  changed: boolean;
} {
  return applyAgentDefaultPrimaryModel({ cfg, model: OPENCODE_GO_DEFAULT_MODEL_REF });
}
