import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { clearPluginDiscoveryCache } from "../plugins/discovery.js";
import {
  clearPluginManifestRegistryCache,
  type PluginManifestRegistry,
} from "../plugins/manifest-registry.js";
import { applyPluginAutoEnable } from "./plugin-auto-enable.js";

const tempDirs: string[] = [];

function chmodSafeDir(dir: string) {
  if (process.platform === "win32") {
    return;
  }
  fs.chmodSync(dir, 0o755);
}

function mkdtempSafe(prefix: string) {
  const dir = fs.mkdtempSync(prefix);
  chmodSafeDir(dir);
  return dir;
}

function mkdirSafe(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  chmodSafeDir(dir);
}

function makeTempDir() {
  const dir = mkdtempSafe(path.join(os.tmpdir(), "foxclaw-plugin-auto-enable-"));
  tempDirs.push(dir);
  return dir;
}

function writePluginManifestFixture(params: { rootDir: string; id: string; channels: string[] }) {
  mkdirSafe(params.rootDir);
  fs.writeFileSync(
    path.join(params.rootDir, "foxclaw.plugin.json"),
    JSON.stringify(
      {
        id: params.id,
        channels: params.channels,
        configSchema: { type: "object" },
      },
      null,
      2,
    ),
    "utf-8",
  );
  fs.writeFileSync(path.join(params.rootDir, "index.ts"), "export default {}", "utf-8");
}

/** Helper to build a minimal PluginManifestRegistry for testing. */
function makeRegistry(plugins: Array<{ id: string; channels: string[] }>): PluginManifestRegistry {
  return {
    plugins: plugins.map((p) => ({
      id: p.id,
      channels: p.channels,
      providers: [],
      skills: [],
      origin: "config" as const,
      rootDir: `/fake/${p.id}`,
      source: `/fake/${p.id}/index.js`,
      manifestPath: `/fake/${p.id}/foxclaw.plugin.json`,
    })),
    diagnostics: [],
  };
}

function makeApnChannelConfig() {
  return { channels: { apn: { someKey: "value" } } };
}

function applyWithSlackConfig(extra?: { plugins?: { allow?: string[] } }) {
  return applyPluginAutoEnable({
    config: {
      channels: { slack: { botToken: "x" } },
      ...(extra?.plugins ? { plugins: extra.plugins } : {}),
    },
    env: {},
  });
}

function applyWithApnChannelConfig(extra?: {
  plugins?: { entries?: Record<string, { enabled: boolean }> };
}) {
  return applyPluginAutoEnable({
    config: {
      ...makeApnChannelConfig(),
      ...(extra?.plugins ? { plugins: extra.plugins } : {}),
    },
    env: {},
    manifestRegistry: makeRegistry([{ id: "apn-channel", channels: ["apn"] }]),
  });
}

afterEach(() => {
  clearPluginDiscoveryCache();
  clearPluginManifestRegistryCache();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("applyPluginAutoEnable", () => {
  it("auto-enables built-in channels and appends to existing allowlist", () => {
    const result = applyWithSlackConfig({ plugins: { allow: ["telegram"] } });

    expect(result.config.channels?.slack?.enabled).toBe(true);
    expect(result.config.plugins?.entries?.slack).toBeUndefined();
    expect(result.config.plugins?.allow).toEqual(["telegram", "slack"]);
    expect(result.changes.join("\n")).toContain("Slack configured, enabled automatically.");
  });

  it("does not create plugins.allow when allowlist is unset", () => {
    const result = applyWithSlackConfig();

    expect(result.config.channels?.slack?.enabled).toBe(true);
    expect(result.config.plugins?.allow).toBeUndefined();
  });

  it("ignores channels.modelByChannel for plugin auto-enable", () => {
    const result = applyPluginAutoEnable({
      config: {
        channels: {
          modelByChannel: {
            openai: {
              whatsapp: "openai/gpt-5.2",
            },
          },
        },
      },
      env: {},
    });

    expect(result.config.plugins?.entries?.modelByChannel).toBeUndefined();
    expect(result.config.plugins?.allow).toBeUndefined();
    expect(result.changes).toEqual([]);
  });

  it("respects explicit disable", () => {
    const result = applyPluginAutoEnable({
      config: {
        channels: { slack: { botToken: "x" } },
        plugins: { entries: { slack: { enabled: false } } },
      },
      env: {},
    });

    expect(result.config.plugins?.entries?.slack?.enabled).toBe(false);
    expect(result.changes).toEqual([]);
  });

  it("respects built-in channel explicit disable via channels.<id>.enabled", () => {
    const result = applyPluginAutoEnable({
      config: {
        channels: { slack: { botToken: "x", enabled: false } },
      },
      env: {},
    });

    expect(result.config.channels?.slack?.enabled).toBe(false);
    expect(result.config.plugins?.entries?.slack).toBeUndefined();
    expect(result.changes).toEqual([]);
  });

  it("uses the provided env when loading plugin manifests automatically", () => {
    const stateDir = makeTempDir();
    const pluginDir = path.join(stateDir, "extensions", "apn-channel");
    writePluginManifestFixture({
      rootDir: pluginDir,
      id: "apn-channel",
      channels: ["apn"],
    });

    const result = applyPluginAutoEnable({
      config: {
        channels: { apn: { someKey: "value" } },
      },
      env: {
        ...process.env,
        FOXCLAW_HOME: undefined,
        FOXCLAW_STATE_DIR: stateDir,
        CLAWDBOT_STATE_DIR: undefined,
        FOXCLAW_BUNDLED_PLUGINS_DIR: "/nonexistent/bundled/plugins",
      },
    });

    expect(result.config.plugins?.entries?.["apn-channel"]?.enabled).toBe(true);
    expect(result.config.plugins?.entries?.apn).toBeUndefined();
  });

  it("uses env-scoped catalog metadata for preferOver auto-enable decisions", () => {
    const stateDir = makeTempDir();
    const catalogPath = path.join(stateDir, "plugins", "catalog.json");
    mkdirSafe(path.dirname(catalogPath));
    fs.writeFileSync(
      catalogPath,
      JSON.stringify({
        entries: [
          {
            name: "@foxclaw/env-secondary",
            foxclaw: {
              channel: {
                id: "env-secondary",
                label: "Env Secondary",
                selectionLabel: "Env Secondary",
                docsPath: "/channels/env-secondary",
                blurb: "Env secondary entry",
                preferOver: ["env-primary"],
              },
              install: {
                npmSpec: "@foxclaw/env-secondary",
              },
            },
          },
        ],
      }),
      "utf-8",
    );

    const result = applyPluginAutoEnable({
      config: {
        channels: {
          "env-primary": { enabled: true },
          "env-secondary": { enabled: true },
        },
      },
      env: {
        ...process.env,
        FOXCLAW_STATE_DIR: stateDir,
        CLAWDBOT_STATE_DIR: undefined,
      },
      manifestRegistry: makeRegistry([]),
    });

    expect(result.config.plugins?.entries?.["env-secondary"]?.enabled).toBe(true);
    expect(result.config.plugins?.entries?.["env-primary"]?.enabled).toBeUndefined();
  });

  it("auto-enables provider auth plugins when profiles exist", () => {
    const result = applyPluginAutoEnable({
      config: {
        auth: {
          profiles: {
            "google-gemini-cli:default": {
              provider: "google-gemini-cli",
              mode: "oauth",
            },
          },
        },
      },
      env: {},
    });

    expect(result.config.plugins?.entries?.["google-gemini-cli-auth"]?.enabled).toBe(true);
  });

  it("auto-enables acpx plugin when ACP is configured", () => {
    const result = applyPluginAutoEnable({
      config: {
        acp: {
          enabled: true,
        },
      },
      env: {},
    });

    expect(result.config.plugins?.entries?.acpx?.enabled).toBe(true);
    expect(result.changes.join("\n")).toContain("ACP runtime configured, enabled automatically.");
  });

  it("does not auto-enable acpx when a different ACP backend is configured", () => {
    const result = applyPluginAutoEnable({
      config: {
        acp: {
          enabled: true,
          backend: "custom-runtime",
        },
      },
      env: {},
    });

    expect(result.config.plugins?.entries?.acpx?.enabled).toBeUndefined();
  });

  it("skips when plugins are globally disabled", () => {
    const result = applyPluginAutoEnable({
      config: {
        channels: { slack: { botToken: "x" } },
        plugins: { enabled: false },
      },
      env: {},
    });

    expect(result.config.plugins?.entries?.slack?.enabled).toBeUndefined();
    expect(result.changes).toEqual([]);
  });

  describe("third-party channel plugins (pluginId ≠ channelId)", () => {
    it("uses the plugin manifest id, not the channel id, for plugins.entries", () => {
      // Reproduces: https://github.com/foxclaw/foxclaw/issues/25261
      // Plugin "apn-channel" declares channels: ["apn"]. Doctor must write
      // plugins.entries["apn-channel"], not plugins.entries["apn"].
      const result = applyWithApnChannelConfig();

      expect(result.config.plugins?.entries?.["apn-channel"]?.enabled).toBe(true);
      expect(result.config.plugins?.entries?.["apn"]).toBeUndefined();
      expect(result.changes.join("\n")).toContain("apn configured, enabled automatically.");
    });

    it("does not double-enable when plugin is already enabled under its plugin id", () => {
      const result = applyWithApnChannelConfig({
        plugins: { entries: { "apn-channel": { enabled: true } } },
      });

      expect(result.changes).toEqual([]);
    });

    it("respects explicit disable of the plugin by its plugin id", () => {
      const result = applyWithApnChannelConfig({
        plugins: { entries: { "apn-channel": { enabled: false } } },
      });

      expect(result.config.plugins?.entries?.["apn-channel"]?.enabled).toBe(false);
      expect(result.changes).toEqual([]);
    });

    it("falls back to channel key as plugin id when no installed manifest declares the channel", () => {
      // Without a matching manifest entry, behavior is unchanged (backward compat).
      const result = applyPluginAutoEnable({
        config: {
          channels: { "unknown-chan": { someKey: "value" } },
        },
        env: {},
        manifestRegistry: makeRegistry([]),
      });

      expect(result.config.plugins?.entries?.["unknown-chan"]?.enabled).toBe(true);
    });
  });

  describe("preferOver channel prioritization", () => {
    it("uses the provided env when loading installed plugin manifests", () => {
      const stateDir = makeTempDir();
      const pluginDir = path.join(stateDir, "extensions", "apn-channel");
      writePluginManifestFixture({
        rootDir: pluginDir,
        id: "apn-channel",
        channels: ["apn"],
      });

      const result = applyPluginAutoEnable({
        config: makeApnChannelConfig(),
        env: {
          ...process.env,
          FOXCLAW_HOME: undefined,
          FOXCLAW_STATE_DIR: stateDir,
          CLAWDBOT_STATE_DIR: undefined,
          FOXCLAW_BUNDLED_PLUGINS_DIR: "/nonexistent/bundled/plugins",
        },
      });

      expect(result.config.plugins?.entries?.["apn-channel"]?.enabled).toBe(true);
      expect(result.config.plugins?.entries?.apn).toBeUndefined();
    });
  });
});
