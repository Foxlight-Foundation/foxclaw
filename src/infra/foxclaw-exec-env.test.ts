import { describe, expect, it } from "vitest";
import {
  ensureOpenClawExecMarkerOnProcess,
  markOpenClawExecEnv,
  FOXCLAW_CLI_ENV_VALUE,
  FOXCLAW_CLI_ENV_VAR,
} from "./foxclaw-exec-env.js";

describe("markOpenClawExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", FOXCLAW_CLI: "0" };
    const marked = markOpenClawExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      FOXCLAW_CLI: FOXCLAW_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.FOXCLAW_CLI).toBe("0");
  });
});

describe("ensureOpenClawExecMarkerOnProcess", () => {
  it("mutates and returns the provided process env", () => {
    const env: NodeJS.ProcessEnv = { PATH: "/usr/bin" };

    expect(ensureOpenClawExecMarkerOnProcess(env)).toBe(env);
    expect(env[FOXCLAW_CLI_ENV_VAR]).toBe(FOXCLAW_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[FOXCLAW_CLI_ENV_VAR];
    delete process.env[FOXCLAW_CLI_ENV_VAR];

    try {
      expect(ensureOpenClawExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[FOXCLAW_CLI_ENV_VAR]).toBe(FOXCLAW_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        delete process.env[FOXCLAW_CLI_ENV_VAR];
      } else {
        process.env[FOXCLAW_CLI_ENV_VAR] = previous;
      }
    }
  });
});
