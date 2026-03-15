import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withTempDir } from "../test-helpers/temp-dir.js";
import {
  resolveDefaultConfigCandidates,
  resolveConfigPathCandidate,
  resolveConfigPath,
  resolveOAuthDir,
  resolveOAuthPath,
  resolveStateDir,
} from "./paths.js";

describe("oauth paths", () => {
  it("prefers FOXCLAW_OAUTH_DIR over FOXCLAW_STATE_DIR", () => {
    const env = {
      FOXCLAW_OAUTH_DIR: "/custom/oauth",
      FOXCLAW_STATE_DIR: "/custom/state",
    } as NodeJS.ProcessEnv;

    expect(resolveOAuthDir(env, "/custom/state")).toBe(path.resolve("/custom/oauth"));
    expect(resolveOAuthPath(env, "/custom/state")).toBe(
      path.join(path.resolve("/custom/oauth"), "oauth.json"),
    );
  });

  it("derives oauth path from FOXCLAW_STATE_DIR when unset", () => {
    const env = {
      FOXCLAW_STATE_DIR: "/custom/state",
    } as NodeJS.ProcessEnv;

    expect(resolveOAuthDir(env, "/custom/state")).toBe(path.join("/custom/state", "credentials"));
    expect(resolveOAuthPath(env, "/custom/state")).toBe(
      path.join("/custom/state", "credentials", "oauth.json"),
    );
  });
});

describe("state + config path candidates", () => {
  function expectFoxClawHomeDefaults(env: NodeJS.ProcessEnv): void {
    const configuredHome = env.FOXCLAW_HOME;
    if (!configuredHome) {
      throw new Error("FOXCLAW_HOME must be set for this assertion helper");
    }
    const resolvedHome = path.resolve(configuredHome);
    expect(resolveStateDir(env)).toBe(path.join(resolvedHome, ".foxclaw"));

    const candidates = resolveDefaultConfigCandidates(env);
    expect(candidates[0]).toBe(path.join(resolvedHome, ".foxclaw", "foxclaw.json"));
  }

  it("uses FOXCLAW_STATE_DIR when set", () => {
    const env = {
      FOXCLAW_STATE_DIR: "/new/state",
    } as NodeJS.ProcessEnv;

    expect(resolveStateDir(env, () => "/home/test")).toBe(path.resolve("/new/state"));
  });

  it("uses FOXCLAW_HOME for default state/config locations", () => {
    const env = {
      FOXCLAW_HOME: "/srv/foxclaw-home",
    } as NodeJS.ProcessEnv;
    expectFoxClawHomeDefaults(env);
  });

  it("prefers FOXCLAW_HOME over HOME for default state/config locations", () => {
    const env = {
      FOXCLAW_HOME: "/srv/foxclaw-home",
      HOME: "/home/other",
    } as NodeJS.ProcessEnv;
    expectFoxClawHomeDefaults(env);
  });

  it("orders default config candidates in a stable order", () => {
    const home = "/home/test";
    const resolvedHome = path.resolve(home);
    const candidates = resolveDefaultConfigCandidates({} as NodeJS.ProcessEnv, () => home);
    // .foxclaw is both the new state dir and the first legacy dir, so its
    // entries appear only once (deduped).
    const expected = [
      path.join(resolvedHome, ".foxclaw", "foxclaw.json"),
      path.join(resolvedHome, ".foxclaw", "clawdbot.json"),
      path.join(resolvedHome, ".foxclaw", "moldbot.json"),
      path.join(resolvedHome, ".foxclaw", "moltbot.json"),
      path.join(resolvedHome, ".clawdbot", "foxclaw.json"),
      path.join(resolvedHome, ".clawdbot", "clawdbot.json"),
      path.join(resolvedHome, ".clawdbot", "moldbot.json"),
      path.join(resolvedHome, ".clawdbot", "moltbot.json"),
      path.join(resolvedHome, ".moldbot", "foxclaw.json"),
      path.join(resolvedHome, ".moldbot", "clawdbot.json"),
      path.join(resolvedHome, ".moldbot", "moldbot.json"),
      path.join(resolvedHome, ".moldbot", "moltbot.json"),
      path.join(resolvedHome, ".moltbot", "foxclaw.json"),
      path.join(resolvedHome, ".moltbot", "clawdbot.json"),
      path.join(resolvedHome, ".moltbot", "moldbot.json"),
      path.join(resolvedHome, ".moltbot", "moltbot.json"),
    ];
    expect(candidates).toEqual(expected);
  });

  it("prefers ~/.foxclaw when it exists and legacy dir is missing", async () => {
    await withTempDir({ prefix: "foxclaw-state-" }, async (root) => {
      const newDir = path.join(root, ".foxclaw");
      await fs.mkdir(newDir, { recursive: true });
      const resolved = resolveStateDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    });
  });

  it("falls back to existing legacy state dir when ~/.foxclaw is missing", async () => {
    await withTempDir({ prefix: "foxclaw-state-legacy-" }, async (root) => {
      const legacyDir = path.join(root, ".clawdbot");
      await fs.mkdir(legacyDir, { recursive: true });
      const resolved = resolveStateDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(legacyDir);
    });
  });

  it("CONFIG_PATH prefers existing config when present", async () => {
    await withTempDir({ prefix: "foxclaw-config-" }, async (root) => {
      const legacyDir = path.join(root, ".foxclaw");
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyPath = path.join(legacyDir, "foxclaw.json");
      await fs.writeFile(legacyPath, "{}", "utf-8");

      const resolved = resolveConfigPathCandidate({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(legacyPath);
    });
  });

  it("respects state dir overrides when config is missing", async () => {
    await withTempDir({ prefix: "foxclaw-config-override-" }, async (root) => {
      const legacyDir = path.join(root, ".foxclaw");
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyConfig = path.join(legacyDir, "foxclaw.json");
      await fs.writeFile(legacyConfig, "{}", "utf-8");

      const overrideDir = path.join(root, "override");
      const env = { FOXCLAW_STATE_DIR: overrideDir } as NodeJS.ProcessEnv;
      const resolved = resolveConfigPath(env, overrideDir, () => root);
      expect(resolved).toBe(path.join(overrideDir, "foxclaw.json"));
    });
  });
});
