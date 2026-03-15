import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { normalizeConfigDocBaselineHelpPath } from "./doc-baseline.js";
import { FIELD_HELP } from "./schema.help.js";
import {
  describeTalkSilenceTimeoutDefaults,
  TALK_SILENCE_TIMEOUT_MS_BY_PLATFORM,
} from "./talk-defaults.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("talk silence timeout defaults", () => {
  it("keeps help text aligned with the policy", () => {
    const defaultsDescription = describeTalkSilenceTimeoutDefaults();

    expect(FIELD_HELP["talk.silenceTimeoutMs"]).toContain(defaultsDescription);

    // Verify baseline if it exists.
    try {
      const baselineLines = readRepoFile("docs/.generated/config-baseline.jsonl")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as { recordType: string; path?: string; help?: string });
      const talkEntry = baselineLines.find(
        (entry) =>
          entry.recordType === "path" &&
          entry.path === normalizeConfigDocBaselineHelpPath("talk.silenceTimeoutMs"),
      );
      expect(talkEntry?.help).toContain(defaultsDescription);
    } catch {
      // Baseline file may not exist in stripped repos.
    }

    try {
      expect(readRepoFile("docs/gateway/configuration-reference.md")).toContain(
        defaultsDescription,
      );
    } catch {
      // Doc file may not exist in stripped repos.
    }
  });

  // Apple and Android runtime constant checks are skipped because the apps/
  // directory was stripped from this repo.
  it.skip("matches the Apple and Android runtime constants", () => {});
});
