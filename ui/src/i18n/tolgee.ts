/// <reference types="vite/client" />

// Tolgee's type declarations re-export from @tolgee/core, which pnpm
// isolates.  tsgo cannot follow the symlink chain, so suppress the
// missing-member errors here. Runtime exports are verified by the build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — Tolgee re-exports bundled in ESM, tsgo can't resolve
import { Tolgee, FormatSimple, BackendFetch, DevTools } from "@tolgee/web";
import en from "./locales/en.json" with { type: "json" };

const isDev =
  typeof import.meta.env !== "undefined" &&
  import.meta.env.DEV === true &&
  import.meta.env.MODE !== "test";

const LOCALE_STORAGE_KEY = "foxclaw.i18n.locale";

/** Persist chosen language under the existing localStorage key. */
function FoxClawLanguageStorage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tolgee: any, tools: any) => {
    tools.setLanguageStorage({
      getLanguage() {
        try {
          return globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY) || undefined;
        } catch {
          return undefined;
        }
      },
      setLanguage(language: string) {
        try {
          globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, language);
        } catch {
          // Ignore storage write failures in private/blocked contexts.
        }
      },
    });
    return tolgee;
  };
}

export const AVAILABLE_LANGUAGES = ["en", "zh-CN", "zh-TW", "pt-BR", "de", "es"];

export type Locale = "en" | "zh-CN" | "zh-TW" | "pt-BR" | "de" | "es";

export const SUPPORTED_LOCALES: ReadonlyArray<Locale> = AVAILABLE_LANGUAGES as Locale[];

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return value !== null && value !== undefined && AVAILABLE_LANGUAGES.includes(value);
}

/** Resolve initial language from navigator when nothing is stored. */
function resolveNavigatorLanguage(): string {
  const nav =
    typeof globalThis.navigator?.language === "string" ? globalThis.navigator.language : "";
  if (nav.startsWith("zh")) {
    return nav === "zh-TW" || nav === "zh-HK" ? "zh-TW" : "zh-CN";
  }
  if (nav.startsWith("pt")) return "pt-BR";
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("es")) return "es";
  return "en";
}

export const tolgee = Tolgee()
  .use(FormatSimple())
  .use(FoxClawLanguageStorage())
  .use(
    BackendFetch({
      prefix: "https://cdn.tolg.ee/d1af77df4ee0f24a25e78125",
      fallbackOnFail: true,
    }),
  )
  .use(isDev ? DevTools() : undefined)
  .init({
    // Falls back to navigator-based detection when no stored locale exists.
    language: resolveNavigatorLanguage(),
    availableLanguages: AVAILABLE_LANGUAGES,
    defaultLanguage: "en",
    fallbackLanguage: "en",
    // All UI keys live under the "foxclaw" namespace.
    ns: ["foxclaw"],
    defaultNs: "foxclaw",
    // Bundled English synchronously so t() works before run() resolves.
    staticData: {
      "en:foxclaw": en,
    },
  });
