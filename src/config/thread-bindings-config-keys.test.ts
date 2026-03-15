import { describe, expect, it } from "vitest";
import { applyLegacyMigrations } from "./legacy.js";
import { migrateLegacyConfig } from "./legacy-migrate.js";
import { validateConfigObjectRaw } from "./validation.js";

describe("thread binding config keys", () => {
  it("rejects legacy session.threadBindings.ttlHours", () => {
    const result = validateConfigObjectRaw({
      session: {
        threadBindings: {
          ttlHours: 24,
        },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        path: "session.threadBindings",
        message: expect.stringContaining("ttlHours"),
      }),
    );
  });

  it("rejects legacy channels.discord.threadBindings.ttlHours", () => {
    const result = validateConfigObjectRaw({
      channels: {
        discord: {
          threadBindings: {
            ttlHours: 24,
          },
        },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        path: "channels.discord.threadBindings",
        message: expect.stringContaining("ttlHours"),
      }),
    );
  });

  it("rejects legacy channels.discord.accounts.<id>.threadBindings.ttlHours", () => {
    const result = validateConfigObjectRaw({
      channels: {
        discord: {
          accounts: {
            alpha: {
              threadBindings: {
                ttlHours: 24,
              },
            },
          },
        },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        path: "channels.discord.accounts",
        message: expect.stringContaining("ttlHours"),
      }),
    );
  });

  it("migrates session.threadBindings.ttlHours to idleHours", () => {
    const result = migrateLegacyConfig({
      session: {
        threadBindings: {
          ttlHours: 24,
        },
      },
    });

    expect(result.config?.session?.threadBindings?.idleHours).toBe(24);
    const normalized = result.config?.session?.threadBindings as
      | Record<string, unknown>
      | undefined;
    expect(normalized?.ttlHours).toBeUndefined();
    expect(result.changes).toContain(
      "Moved session.threadBindings.ttlHours → session.threadBindings.idleHours.",
    );
  });

  it("migrates Discord threadBindings.ttlHours for root and account entries", () => {
    // Discord was removed as a built-in channel, so we use applyLegacyMigrations
    // directly (without validation) to verify the migration logic still works.
    const { next: config, changes } = applyLegacyMigrations({
      channels: {
        discord: {
          threadBindings: {
            ttlHours: 12,
          },
          accounts: {
            alpha: {
              threadBindings: {
                ttlHours: 6,
              },
            },
            beta: {
              threadBindings: {
                idleHours: 4,
                ttlHours: 9,
              },
            },
          },
        },
      },
    });

    const channels = (config as Record<string, unknown> | null)?.channels as
      | Record<string, unknown>
      | undefined;
    const discord = channels?.discord as Record<string, unknown> | undefined;
    const threadBindings = discord?.threadBindings as Record<string, unknown> | undefined;
    expect(threadBindings?.idleHours).toBe(12);
    expect(threadBindings?.ttlHours).toBeUndefined();

    const accounts = discord?.accounts as Record<string, Record<string, unknown>> | undefined;
    const alphaBindings = accounts?.alpha?.threadBindings as Record<string, unknown> | undefined;
    expect(alphaBindings?.idleHours).toBe(6);
    expect(alphaBindings?.ttlHours).toBeUndefined();

    const betaBindings = accounts?.beta?.threadBindings as Record<string, unknown> | undefined;
    expect(betaBindings?.idleHours).toBe(4);
    expect(betaBindings?.ttlHours).toBeUndefined();

    expect(changes).toContain(
      "Moved channels.discord.threadBindings.ttlHours → channels.discord.threadBindings.idleHours.",
    );
    expect(changes).toContain(
      "Moved channels.discord.accounts.alpha.threadBindings.ttlHours → channels.discord.accounts.alpha.threadBindings.idleHours.",
    );
    expect(changes).toContain(
      "Removed channels.discord.accounts.beta.threadBindings.ttlHours (channels.discord.accounts.beta.threadBindings.idleHours already set).",
    );
  });
});
