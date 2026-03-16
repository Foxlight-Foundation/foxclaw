import { describe, expect, it } from "vitest";
import {
  AVAILABLE_LANGUAGES,
  SUPPORTED_LOCALES,
  isSupportedLocale,
} from "../../ui/src/i18n/tolgee.ts";

describe("ui i18n locale constants", () => {
  it("lists supported locales", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "zh-CN", "zh-TW", "pt-BR", "de", "es"]);
    expect(AVAILABLE_LANGUAGES).toEqual(SUPPORTED_LOCALES);
  });

  it("validates locale strings", () => {
    expect(isSupportedLocale("de")).toBe(true);
    expect(isSupportedLocale("zh-CN")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
  });
});
