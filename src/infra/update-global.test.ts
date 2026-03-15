import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { captureEnv } from "../test-utils/env.js";
import {
  cleanupGlobalRenameDirs,
  detectGlobalInstallManagerByPresence,
  detectGlobalInstallManagerForRoot,
  globalInstallArgs,
  globalInstallFallbackArgs,
  resolveGlobalPackageRoot,
  resolveGlobalInstallSpec,
  resolveGlobalRoot,
  type CommandRunner,
} from "./update-global.js";

describe("update global helpers", () => {
  let envSnapshot: ReturnType<typeof captureEnv> | undefined;

  afterEach(() => {
    envSnapshot?.restore();
    envSnapshot = undefined;
  });

  it("prefers explicit package spec overrides", () => {
    envSnapshot = captureEnv(["FOXCLAW_UPDATE_PACKAGE_SPEC"]);
    process.env.FOXCLAW_UPDATE_PACKAGE_SPEC = "file:/tmp/foxclaw.tgz";

    expect(resolveGlobalInstallSpec({ packageName: "foxclaw", tag: "latest" })).toBe(
      "file:/tmp/foxclaw.tgz",
    );
    expect(
      resolveGlobalInstallSpec({
        packageName: "foxclaw",
        tag: "beta",
        env: { FOXCLAW_UPDATE_PACKAGE_SPEC: "openclaw@next" },
      }),
    ).toBe("openclaw@next");
  });

  it("resolves global roots and package roots from runner output", async () => {
    const runCommand: CommandRunner = async (argv) => {
      if (argv[0] === "npm") {
        return { stdout: "/tmp/npm-root\n", stderr: "", code: 0 };
      }
      if (argv[0] === "pnpm") {
        return { stdout: "", stderr: "", code: 1 };
      }
      throw new Error(`unexpected command: ${argv.join(" ")}`);
    };

    await expect(resolveGlobalRoot("npm", runCommand, 1000)).resolves.toBe("/tmp/npm-root");
    await expect(resolveGlobalRoot("pnpm", runCommand, 1000)).resolves.toBeNull();
    await expect(resolveGlobalRoot("bun", runCommand, 1000)).resolves.toContain(
      path.join(".bun", "install", "global", "node_modules"),
    );
    await expect(resolveGlobalPackageRoot("npm", runCommand, 1000)).resolves.toBe(
      path.join("/tmp/npm-root", "foxclaw"),
    );
  });

  it("detects install managers from resolved roots and on-disk presence", async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), "foxclaw-update-global-"));
    const npmRoot = path.join(base, "npm-root");
    const pnpmRoot = path.join(base, "pnpm-root");
    const bunRoot = path.join(base, ".bun", "install", "global", "node_modules");
    const pkgRoot = path.join(pnpmRoot, "foxclaw");
    await fs.mkdir(pkgRoot, { recursive: true });
    await fs.mkdir(path.join(npmRoot, "foxclaw"), { recursive: true });
    await fs.mkdir(path.join(bunRoot, "foxclaw"), { recursive: true });

    envSnapshot = captureEnv(["BUN_INSTALL"]);
    process.env.BUN_INSTALL = path.join(base, ".bun");

    const runCommand: CommandRunner = async (argv) => {
      if (argv[0] === "npm") {
        return { stdout: `${npmRoot}\n`, stderr: "", code: 0 };
      }
      if (argv[0] === "pnpm") {
        return { stdout: `${pnpmRoot}\n`, stderr: "", code: 0 };
      }
      throw new Error(`unexpected command: ${argv.join(" ")}`);
    };

    await expect(detectGlobalInstallManagerForRoot(runCommand, pkgRoot, 1000)).resolves.toBe(
      "pnpm",
    );
    await expect(detectGlobalInstallManagerByPresence(runCommand, 1000)).resolves.toBe("npm");

    await fs.rm(path.join(npmRoot, "foxclaw"), { recursive: true, force: true });
    await fs.rm(path.join(pnpmRoot, "foxclaw"), { recursive: true, force: true });
    await expect(detectGlobalInstallManagerByPresence(runCommand, 1000)).resolves.toBe("bun");
  });

  it("builds install argv and npm fallback argv", () => {
    expect(globalInstallArgs("npm", "openclaw@latest")).toEqual([
      "npm",
      "i",
      "-g",
      "openclaw@latest",
      "--no-fund",
      "--no-audit",
      "--loglevel=error",
    ]);
    expect(globalInstallArgs("pnpm", "openclaw@latest")).toEqual([
      "pnpm",
      "add",
      "-g",
      "openclaw@latest",
    ]);
    expect(globalInstallArgs("bun", "openclaw@latest")).toEqual([
      "bun",
      "add",
      "-g",
      "openclaw@latest",
    ]);

    expect(globalInstallFallbackArgs("npm", "openclaw@latest")).toEqual([
      "npm",
      "i",
      "-g",
      "openclaw@latest",
      "--omit=optional",
      "--no-fund",
      "--no-audit",
      "--loglevel=error",
    ]);
    expect(globalInstallFallbackArgs("pnpm", "openclaw@latest")).toBeNull();
  });

  it("cleans only renamed package directories", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "foxclaw-update-cleanup-"));
    await fs.mkdir(path.join(root, ".foxclaw-123"), { recursive: true });
    await fs.mkdir(path.join(root, ".foxclaw-456"), { recursive: true });
    await fs.writeFile(path.join(root, ".foxclaw-file"), "nope", "utf8");
    await fs.mkdir(path.join(root, "foxclaw"), { recursive: true });

    await expect(
      cleanupGlobalRenameDirs({
        globalRoot: root,
        packageName: "foxclaw",
      }),
    ).resolves.toEqual({
      removed: [".foxclaw-123", ".foxclaw-456"],
    });
    await expect(fs.stat(path.join(root, "foxclaw"))).resolves.toBeDefined();
    await expect(fs.stat(path.join(root, ".foxclaw-file"))).resolves.toBeDefined();
  });
});
