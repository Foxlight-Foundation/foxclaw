import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "foxclaw",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "foxclaw", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "foxclaw", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "foxclaw", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "foxclaw", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "foxclaw", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "foxclaw", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "foxclaw", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "foxclaw", "--profile", "work", "--dev", "status"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".foxclaw-dev");
    expect(env.FOXCLAW_PROFILE).toBe("dev");
    expect(env.FOXCLAW_STATE_DIR).toBe(expectedStateDir);
    expect(env.FOXCLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "foxclaw.json"));
    expect(env.FOXCLAW_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      FOXCLAW_STATE_DIR: "/custom",
      FOXCLAW_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.FOXCLAW_STATE_DIR).toBe("/custom");
    expect(env.FOXCLAW_GATEWAY_PORT).toBe("19099");
    expect(env.FOXCLAW_CONFIG_PATH).toBe(path.join("/custom", "foxclaw.json"));
  });

  it("uses FOXCLAW_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      FOXCLAW_HOME: "/srv/foxclaw-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/foxclaw-home");
    expect(env.FOXCLAW_STATE_DIR).toBe(path.join(resolvedHome, ".foxclaw-work"));
    expect(env.FOXCLAW_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".foxclaw-work", "foxclaw.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "foxclaw doctor --fix",
      env: {},
      expected: "foxclaw doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "foxclaw doctor --fix",
      env: { FOXCLAW_PROFILE: "default" },
      expected: "foxclaw doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "foxclaw doctor --fix",
      env: { FOXCLAW_PROFILE: "Default" },
      expected: "foxclaw doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "foxclaw doctor --fix",
      env: { FOXCLAW_PROFILE: "bad profile" },
      expected: "foxclaw doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "foxclaw --profile work doctor --fix",
      env: { FOXCLAW_PROFILE: "work" },
      expected: "foxclaw --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "foxclaw --dev doctor",
      env: { FOXCLAW_PROFILE: "dev" },
      expected: "foxclaw --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("foxclaw doctor --fix", { FOXCLAW_PROFILE: "work" })).toBe(
      "foxclaw --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("foxclaw doctor --fix", { FOXCLAW_PROFILE: "  jbfoxclaw  " })).toBe(
      "foxclaw --profile jbfoxclaw doctor --fix",
    );
  });

  it("handles command with no args after foxclaw", () => {
    expect(formatCliCommand("foxclaw", { FOXCLAW_PROFILE: "test" })).toBe(
      "foxclaw --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm foxclaw doctor", { FOXCLAW_PROFILE: "work" })).toBe(
      "pnpm foxclaw --profile work doctor",
    );
  });
});
