import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clearPluginManifestRegistryCache } from "../plugins/manifest-registry.js";
import { validateConfigObjectWithPlugins } from "./config.js";

async function chmodSafeDir(dir: string) {
  if (process.platform === "win32") {
    return;
  }
  await fs.chmod(dir, 0o755);
}

async function mkdirSafe(dir: string) {
  await fs.mkdir(dir, { recursive: true });
  await chmodSafeDir(dir);
}

async function writePluginFixture(params: {
  dir: string;
  id: string;
  schema: Record<string, unknown>;
  channels?: string[];
}) {
  await mkdirSafe(params.dir);
  await fs.writeFile(
    path.join(params.dir, "index.js"),
    `export default { id: "${params.id}", register() {} };`,
    "utf-8",
  );
  const manifest: Record<string, unknown> = {
    id: params.id,
    configSchema: params.schema,
  };
  if (params.channels) {
    manifest.channels = params.channels;
  }
  await fs.writeFile(
    path.join(params.dir, "foxclaw.plugin.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );
}

describe("config plugin validation", () => {
  let fixtureRoot = "";
  let suiteHome = "";
  let badPluginDir = "";
  let enumPluginDir = "";
  let testChannelPluginDir = "";
  const suiteEnv = () =>
    ({
      ...process.env,
      HOME: suiteHome,
      FOXCLAW_HOME: undefined,
      FOXCLAW_STATE_DIR: path.join(suiteHome, ".foxclaw"),
      CLAWDBOT_STATE_DIR: undefined,
      FOXCLAW_PLUGIN_MANIFEST_CACHE_MS: "10000",
    }) satisfies NodeJS.ProcessEnv;

  const validateInSuite = (raw: unknown) =>
    validateConfigObjectWithPlugins(raw, { env: suiteEnv() });

  beforeAll(async () => {
    fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "foxclaw-config-plugin-validation-"));
    await chmodSafeDir(fixtureRoot);
    suiteHome = path.join(fixtureRoot, "home");
    await mkdirSafe(suiteHome);
    badPluginDir = path.join(suiteHome, "bad-plugin");
    enumPluginDir = path.join(suiteHome, "enum-plugin");
    testChannelPluginDir = path.join(suiteHome, "test-channel-plugin");
    await writePluginFixture({
      dir: badPluginDir,
      id: "bad-plugin",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "boolean" },
        },
        required: ["value"],
      },
    });
    await writePluginFixture({
      dir: enumPluginDir,
      id: "enum-plugin",
      schema: {
        type: "object",
        properties: {
          fileFormat: {
            type: "string",
            enum: ["markdown", "html"],
          },
        },
        required: ["fileFormat"],
      },
    });
    await writePluginFixture({
      dir: testChannelPluginDir,
      id: "test-channel-plugin",
      channels: ["test-channel"],
      schema: { type: "object" },
    });
    clearPluginManifestRegistryCache();
    // Warm the plugin manifest cache once so path-based validations can reuse
    // parsed manifests across test cases.
    validateInSuite({
      plugins: {
        enabled: false,
        load: { paths: [badPluginDir, testChannelPluginDir] },
      },
    });
  });

  afterAll(async () => {
    await fs.rm(fixtureRoot, { recursive: true, force: true });
    clearPluginManifestRegistryCache();
  });

  it("reports missing plugin refs across load paths, entries, and allowlist surfaces", async () => {
    const missingPath = path.join(suiteHome, "missing-plugin-dir");
    const res = validateInSuite({
      agents: { list: [{ id: "pi" }] },
      plugins: {
        enabled: false,
        load: { paths: [missingPath] },
        entries: { "missing-plugin": { enabled: true } },
        allow: ["missing-allow"],
        deny: ["missing-deny"],
        slots: { memory: "missing-slot" },
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(
        res.issues.some(
          (issue) =>
            issue.path === "plugins.load.paths" && issue.message.includes("plugin path not found"),
        ),
      ).toBe(true);
      expect(res.issues).toEqual(
        expect.arrayContaining([
          { path: "plugins.allow", message: "plugin not found: missing-allow" },
          { path: "plugins.deny", message: "plugin not found: missing-deny" },
          { path: "plugins.slots.memory", message: "plugin not found: missing-slot" },
        ]),
      );
      expect(res.warnings).toContainEqual({
        path: "plugins.entries.missing-plugin",
        message:
          "plugin not found: missing-plugin (stale config entry ignored; remove it from plugins config)",
      });
    }
  });

  it("warns for removed legacy plugin ids instead of failing validation", async () => {
    const removedId = "google-antigravity-auth";
    const res = validateInSuite({
      agents: { list: [{ id: "pi" }] },
      plugins: {
        enabled: false,
        entries: { [removedId]: { enabled: true } },
        allow: [removedId],
        deny: [removedId],
        slots: { memory: removedId },
      },
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.warnings).toEqual(
        expect.arrayContaining([
          {
            path: `plugins.entries.${removedId}`,
            message:
              "plugin removed: google-antigravity-auth (stale config entry ignored; remove it from plugins config)",
          },
          {
            path: "plugins.allow",
            message:
              "plugin removed: google-antigravity-auth (stale config entry ignored; remove it from plugins config)",
          },
          {
            path: "plugins.deny",
            message:
              "plugin removed: google-antigravity-auth (stale config entry ignored; remove it from plugins config)",
          },
          {
            path: "plugins.slots.memory",
            message:
              "plugin removed: google-antigravity-auth (stale config entry ignored; remove it from plugins config)",
          },
        ]),
      );
    }
  });

  it("surfaces plugin config diagnostics", async () => {
    const res = validateInSuite({
      agents: { list: [{ id: "pi" }] },
      plugins: {
        enabled: true,
        load: { paths: [badPluginDir] },
        entries: { "bad-plugin": { config: { value: "nope" } } },
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const hasIssue = res.issues.some(
        (issue) =>
          issue.path.startsWith("plugins.entries.bad-plugin.config") &&
          issue.message.includes("invalid config"),
      );
      expect(hasIssue).toBe(true);
    }
  });

  it("surfaces allowed enum values for plugin config diagnostics", async () => {
    const res = validateInSuite({
      agents: { list: [{ id: "pi" }] },
      plugins: {
        enabled: true,
        load: { paths: [enumPluginDir] },
        entries: { "enum-plugin": { config: { fileFormat: "txt" } } },
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const issue = res.issues.find(
        (entry) => entry.path === "plugins.entries.enum-plugin.config.fileFormat",
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('allowed: "markdown", "html"');
      expect(issue?.allowedValues).toEqual(["markdown", "html"]);
      expect(issue?.allowedValuesHiddenCount).toBe(0);
    }
  });

  it("accepts known plugin ids and valid channel/heartbeat enums", async () => {
    const res = validateInSuite({
      agents: {
        defaults: { heartbeat: { target: "last", directPolicy: "block" } },
        list: [{ id: "pi", heartbeat: { directPolicy: "allow" } }],
      },
      channels: {
        modelByChannel: {
          openai: {
            slack: "openai/gpt-5.2",
          },
        },
      },
      plugins: { enabled: false, entries: { slack: { enabled: true } } },
    });
    expect(res.ok).toBe(true);
  });

  it("accepts plugin heartbeat targets", async () => {
    const res = validateInSuite({
      agents: { defaults: { heartbeat: { target: "test-channel" } }, list: [{ id: "pi" }] },
      plugins: { enabled: false, load: { paths: [testChannelPluginDir] } },
    });
    expect(res.ok).toBe(true);
  });

  it("rejects unknown heartbeat targets", async () => {
    const res = validateInSuite({
      agents: {
        defaults: { heartbeat: { target: "not-a-channel" } },
        list: [{ id: "pi" }],
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues).toContainEqual({
        path: "agents.defaults.heartbeat.target",
        message: "unknown heartbeat target: not-a-channel",
      });
    }
  });

  it("rejects invalid heartbeat directPolicy values", async () => {
    const res = validateInSuite({
      agents: {
        defaults: { heartbeat: { directPolicy: "maybe" } },
        list: [{ id: "pi" }],
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(
        res.issues.some((issue) => issue.path === "agents.defaults.heartbeat.directPolicy"),
      ).toBe(true);
    }
  });
});
