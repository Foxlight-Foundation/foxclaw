import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FoxClawConfig } from "../config/config.js";
import {
  hasConfiguredModelFallbacks,
  resolveAgentConfig,
  resolveAgentDir,
  resolveAgentEffectiveModelPrimary,
  resolveAgentExplicitModelPrimary,
  resolveFallbackAgentId,
  resolveEffectiveModelFallbacks,
  resolveAgentModelFallbacksOverride,
  resolveAgentModelPrimary,
  resolveRunModelFallbacksOverride,
  resolveAgentWorkspaceDir,
  resolveAgentIdByWorkspacePath,
  resolveAgentIdsByWorkspacePath,
} from "./agent-scope.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveAgentConfig", () => {
  it("should return undefined when no agents config exists", () => {
    const cfg: FoxClawConfig = {};
    const result = resolveAgentConfig(cfg, "main");
    expect(result).toBeUndefined();
  });

  it("should return undefined when agent id does not exist", () => {
    const cfg: FoxClawConfig = {
      agents: {
        list: [{ id: "main", workspace: "~/foxclaw" }],
      },
    };
    const result = resolveAgentConfig(cfg, "nonexistent");
    expect(result).toBeUndefined();
  });

  it("should return basic agent config", () => {
    const cfg: FoxClawConfig = {
      agents: {
        list: [
          {
            id: "main",
            name: "Main Agent",
            workspace: "~/foxclaw",
            agentDir: "~/.foxclaw/agents/main",
            model: "anthropic/claude-opus-4",
          },
        ],
      },
    };
    const result = resolveAgentConfig(cfg, "main");
    expect(result).toEqual({
      name: "Main Agent",
      workspace: "~/foxclaw",
      agentDir: "~/.foxclaw/agents/main",
      model: "anthropic/claude-opus-4",
      identity: undefined,
      groupChat: undefined,
      subagents: undefined,
      sandbox: undefined,
      tools: undefined,
    });
  });

  it("resolves explicit and effective model primary separately", () => {
    const cfgWithStringDefault = {
      agents: {
        defaults: {
          model: "anthropic/claude-sonnet-4",
        },
        list: [{ id: "main" }],
      },
    } as unknown as FoxClawConfig;
    expect(resolveAgentExplicitModelPrimary(cfgWithStringDefault, "main")).toBeUndefined();
    expect(resolveAgentEffectiveModelPrimary(cfgWithStringDefault, "main")).toBe(
      "anthropic/claude-sonnet-4",
    );

    const cfgWithObjectDefault: FoxClawConfig = {
      agents: {
        defaults: {
          model: {
            primary: "openai/gpt-5.2",
            fallbacks: ["anthropic/claude-sonnet-4"],
          },
        },
        list: [{ id: "main" }],
      },
    };
    expect(resolveAgentExplicitModelPrimary(cfgWithObjectDefault, "main")).toBeUndefined();
    expect(resolveAgentEffectiveModelPrimary(cfgWithObjectDefault, "main")).toBe("openai/gpt-5.2");

    const cfgNoDefaults: FoxClawConfig = {
      agents: {
        list: [{ id: "main" }],
      },
    };
    expect(resolveAgentExplicitModelPrimary(cfgNoDefaults, "main")).toBeUndefined();
    expect(resolveAgentEffectiveModelPrimary(cfgNoDefaults, "main")).toBeUndefined();
  });

  it("supports per-agent model primary+fallbacks", () => {
    const cfg: FoxClawConfig = {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4",
            fallbacks: ["openai/gpt-4.1"],
          },
        },
        list: [
          {
            id: "linus",
            model: {
              primary: "anthropic/claude-opus-4",
              fallbacks: ["openai/gpt-5.2"],
            },
          },
        ],
      },
    };

    expect(resolveAgentModelPrimary(cfg, "linus")).toBe("anthropic/claude-opus-4");
    expect(resolveAgentExplicitModelPrimary(cfg, "linus")).toBe("anthropic/claude-opus-4");
    expect(resolveAgentEffectiveModelPrimary(cfg, "linus")).toBe("anthropic/claude-opus-4");
    expect(resolveAgentModelFallbacksOverride(cfg, "linus")).toEqual(["openai/gpt-5.2"]);

    // If fallbacks isn't present, we don't override the global fallbacks.
    const cfgNoOverride: FoxClawConfig = {
      agents: {
        list: [
          {
            id: "linus",
            model: {
              primary: "anthropic/claude-opus-4",
            },
          },
        ],
      },
    };
    expect(resolveAgentModelFallbacksOverride(cfgNoOverride, "linus")).toBe(undefined);

    // Explicit empty list disables global fallbacks for that agent.
    const cfgDisable: FoxClawConfig = {
      agents: {
        list: [
          {
            id: "linus",
            model: {
              primary: "anthropic/claude-opus-4",
              fallbacks: [],
            },
          },
        ],
      },
    };
    expect(resolveAgentModelFallbacksOverride(cfgDisable, "linus")).toEqual([]);

    expect(
      resolveEffectiveModelFallbacks({
        cfg,
        agentId: "linus",
        hasSessionModelOverride: false,
      }),
    ).toEqual(["openai/gpt-5.2"]);
    expect(
      resolveEffectiveModelFallbacks({
        cfg,
        agentId: "linus",
        hasSessionModelOverride: true,
      }),
    ).toEqual(["openai/gpt-5.2"]);
    expect(
      resolveEffectiveModelFallbacks({
        cfg: cfgNoOverride,
        agentId: "linus",
        hasSessionModelOverride: true,
      }),
    ).toEqual([]);

    const cfgInheritDefaults: FoxClawConfig = {
      agents: {
        defaults: {
          model: {
            fallbacks: ["openai/gpt-4.1"],
          },
        },
        list: [
          {
            id: "linus",
            model: {
              primary: "anthropic/claude-opus-4",
            },
          },
        ],
      },
    };
    expect(
      resolveEffectiveModelFallbacks({
        cfg: cfgInheritDefaults,
        agentId: "linus",
        hasSessionModelOverride: true,
      }),
    ).toEqual(["openai/gpt-4.1"]);
    expect(
      resolveEffectiveModelFallbacks({
        cfg: cfgDisable,
        agentId: "linus",
        hasSessionModelOverride: true,
      }),
    ).toEqual([]);
  });

  it("resolves fallback agent id from explicit agent id first", () => {
    expect(
      resolveFallbackAgentId({
        agentId: "Support",
        sessionKey: "agent:main:session",
      }),
    ).toBe("support");
  });

  it("resolves fallback agent id from session key when explicit id is missing", () => {
    expect(
      resolveFallbackAgentId({
        sessionKey: "agent:worker:session",
      }),
    ).toBe("worker");
  });

  it("resolves run fallback overrides via shared helper", () => {
    const cfg: FoxClawConfig = {
      agents: {
        defaults: {
          model: {
            fallbacks: ["openai/gpt-4.1"],
          },
        },
        list: [
          {
            id: "support",
            model: {
              fallbacks: ["openai/gpt-5.2"],
            },
          },
        ],
      },
    };

    expect(
      resolveRunModelFallbacksOverride({
        cfg,
        agentId: "support",
        sessionKey: "agent:main:session",
      }),
    ).toEqual(["openai/gpt-5.2"]);
    expect(
      resolveRunModelFallbacksOverride({
        cfg,
        agentId: undefined,
        sessionKey: "agent:support:session",
      }),
    ).toEqual(["openai/gpt-5.2"]);
  });

  it("computes whether any model fallbacks are configured via shared helper", () => {
    const cfgDefaultsOnly: FoxClawConfig = {
      agents: {
        defaults: {
          model: {
            fallbacks: ["openai/gpt-4.1"],
          },
        },
        list: [{ id: "main" }],
      },
    };
    expect(
      hasConfiguredModelFallbacks({
        cfg: cfgDefaultsOnly,
        sessionKey: "agent:main:session",
      }),
    ).toBe(true);

    const cfgAgentOverrideOnly: FoxClawConfig = {
      agents: {
        defaults: {
          model: {
            fallbacks: [],
          },
        },
        list: [
          {
            id: "support",
            model: {
              fallbacks: ["openai/gpt-5.2"],
            },
          },
        ],
      },
    };
    expect(
      hasConfiguredModelFallbacks({
        cfg: cfgAgentOverrideOnly,
        agentId: "support",
        sessionKey: "agent:support:session",
      }),
    ).toBe(true);
    expect(
      hasConfiguredModelFallbacks({
        cfg: cfgAgentOverrideOnly,
        agentId: "main",
        sessionKey: "agent:main:session",
      }),
    ).toBe(false);
  });

  it("should return agent-specific sandbox config", () => {
    const cfg: FoxClawConfig = {
      agents: {
        list: [
          {
            id: "work",
            workspace: "~/foxclaw-work",
            sandbox: {
              mode: "all",
              scope: "agent",
              perSession: false,
              workspaceAccess: "ro",
              workspaceRoot: "~/sandboxes",
            },
          },
        ],
      },
    };
    const result = resolveAgentConfig(cfg, "work");
    expect(result?.sandbox).toEqual({
      mode: "all",
      scope: "agent",
      perSession: false,
      workspaceAccess: "ro",
      workspaceRoot: "~/sandboxes",
    });
  });

  it("should return agent-specific tools config", () => {
    const cfg: FoxClawConfig = {
      agents: {
        list: [
          {
            id: "restricted",
            workspace: "~/foxclaw-restricted",
            tools: {
              allow: ["read"],
              deny: ["exec", "write", "edit"],
              elevated: {
                enabled: false,
                allowFrom: { whatsapp: ["+15555550123"] },
              },
            },
          },
        ],
      },
    };
    const result = resolveAgentConfig(cfg, "restricted");
    expect(result?.tools).toEqual({
      allow: ["read"],
      deny: ["exec", "write", "edit"],
      elevated: {
        enabled: false,
        allowFrom: { whatsapp: ["+15555550123"] },
      },
    });
  });

  it("should return both sandbox and tools config", () => {
    const cfg: FoxClawConfig = {
      agents: {
        list: [
          {
            id: "family",
            workspace: "~/foxclaw-family",
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: ["read"],
              deny: ["exec"],
            },
          },
        ],
      },
    };
    const result = resolveAgentConfig(cfg, "family");
    expect(result?.sandbox?.mode).toBe("all");
    expect(result?.tools?.allow).toEqual(["read"]);
  });

  it("should normalize agent id", () => {
    const cfg: FoxClawConfig = {
      agents: {
        list: [{ id: "main", workspace: "~/foxclaw" }],
      },
    };
    // Should normalize to "main" (default)
    const result = resolveAgentConfig(cfg, "");
    expect(result).toBeDefined();
    expect(result?.workspace).toBe("~/foxclaw");
  });

  it("uses FOXCLAW_HOME for default agent workspace", () => {
    const home = path.join(path.sep, "srv", "foxclaw-home");
    vi.stubEnv("FOXCLAW_HOME", home);

    const workspace = resolveAgentWorkspaceDir({} as FoxClawConfig, "main");
    expect(workspace).toBe(path.join(path.resolve(home), ".foxclaw", "workspace"));
  });

  it("uses FOXCLAW_HOME for default agentDir", () => {
    const home = path.join(path.sep, "srv", "foxclaw-home");
    vi.stubEnv("FOXCLAW_HOME", home);
    // Clear state dir so it falls back to FOXCLAW_HOME
    vi.stubEnv("FOXCLAW_STATE_DIR", "");

    const agentDir = resolveAgentDir({} as FoxClawConfig, "main");
    expect(agentDir).toBe(path.join(path.resolve(home), ".foxclaw", "agents", "main", "agent"));
  });
});

describe("resolveAgentIdByWorkspacePath", () => {
  it("returns the most specific workspace match for a directory", () => {
    const workspaceRoot = `/tmp/foxclaw-agent-scope-${Date.now()}-root`;
    const opsWorkspace = `${workspaceRoot}/projects/ops`;
    const cfg: FoxClawConfig = {
      agents: {
        list: [
          { id: "main", workspace: workspaceRoot },
          { id: "ops", workspace: opsWorkspace },
        ],
      },
    };

    expect(resolveAgentIdByWorkspacePath(cfg, `${opsWorkspace}/src`)).toBe("ops");
  });

  it("returns undefined when directory has no matching workspace", () => {
    const workspaceRoot = `/tmp/foxclaw-agent-scope-${Date.now()}-root`;
    const cfg: FoxClawConfig = {
      agents: {
        list: [
          { id: "main", workspace: workspaceRoot },
          { id: "ops", workspace: `${workspaceRoot}-ops` },
        ],
      },
    };

    expect(
      resolveAgentIdByWorkspacePath(cfg, `/tmp/foxclaw-agent-scope-${Date.now()}-unrelated`),
    ).toBeUndefined();
  });

  it("matches workspace paths through symlink aliases", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "foxclaw-agent-scope-"));
    const realWorkspaceRoot = path.join(tempRoot, "real-root");
    const realOpsWorkspace = path.join(realWorkspaceRoot, "projects", "ops");
    const aliasWorkspaceRoot = path.join(tempRoot, "alias-root");
    try {
      fs.mkdirSync(path.join(realOpsWorkspace, "src"), { recursive: true });
      fs.symlinkSync(
        realWorkspaceRoot,
        aliasWorkspaceRoot,
        process.platform === "win32" ? "junction" : "dir",
      );

      const cfg: FoxClawConfig = {
        agents: {
          list: [
            { id: "main", workspace: realWorkspaceRoot },
            { id: "ops", workspace: realOpsWorkspace },
          ],
        },
      };

      expect(
        resolveAgentIdByWorkspacePath(cfg, path.join(aliasWorkspaceRoot, "projects", "ops")),
      ).toBe("ops");
      expect(
        resolveAgentIdByWorkspacePath(cfg, path.join(aliasWorkspaceRoot, "projects", "ops", "src")),
      ).toBe("ops");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

describe("resolveAgentIdsByWorkspacePath", () => {
  it("returns matching workspaces ordered by specificity", () => {
    const workspaceRoot = `/tmp/foxclaw-agent-scope-${Date.now()}-root`;
    const opsWorkspace = `${workspaceRoot}/projects/ops`;
    const opsDevWorkspace = `${opsWorkspace}/dev`;
    const cfg: FoxClawConfig = {
      agents: {
        list: [
          { id: "main", workspace: workspaceRoot },
          { id: "ops", workspace: opsWorkspace },
          { id: "ops-dev", workspace: opsDevWorkspace },
        ],
      },
    };

    expect(resolveAgentIdsByWorkspacePath(cfg, `${opsDevWorkspace}/pkg`)).toEqual([
      "ops-dev",
      "ops",
      "main",
    ]);
  });
});
