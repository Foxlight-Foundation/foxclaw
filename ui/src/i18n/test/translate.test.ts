import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("i18n (tolgee)", () => {
  let mod: typeof import("../index.ts");

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("localStorage", createStorageMock());
    vi.stubGlobal("navigator", { language: "en-US" } as Navigator);
    mod = await import("../index.ts");
    await mod.tolgee.run();
  });

  afterEach(async () => {
    mod.tolgee.stop();
    vi.unstubAllGlobals();
  });

  it("returns the key if translation is missing", () => {
    expect(mod.t("non.existent.key")).toBe("non.existent.key");
  });

  it("returns the correct English translation", () => {
    expect(mod.t("common.health")).toBe("Health");
  });

  it("replaces parameters correctly", () => {
    expect(mod.t("overview.stats.cronNext", { time: "10:00" })).toBe("Next wake 10:00");
  });

  it("falls back to English if key is missing in another locale", async () => {
    await mod.tolgee.changeLanguage("de");
    // "common.search" is only in English
    expect(mod.t("common.search")).toBe("Search");
  });

  it("isSupportedLocale validates correctly", () => {
    expect(mod.isSupportedLocale("en")).toBe(true);
    expect(mod.isSupportedLocale("zh-CN")).toBe(true);
    expect(mod.isSupportedLocale("fr")).toBe(false);
    expect(mod.isSupportedLocale(null)).toBe(false);
    expect(mod.isSupportedLocale(undefined)).toBe(false);
  });

  it("SUPPORTED_LOCALES contains all languages", () => {
    expect(mod.SUPPORTED_LOCALES).toEqual(["en", "zh-CN", "zh-TW", "pt-BR", "de", "es"]);
  });
});

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}
