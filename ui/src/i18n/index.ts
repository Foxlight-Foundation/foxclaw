export { tolgee, SUPPORTED_LOCALES, isSupportedLocale } from "./tolgee.ts";
export type { Locale } from "./tolgee.ts";
export { I18nController } from "./lib/lit-controller.ts";
import { tolgee } from "./tolgee.ts";

export function t(key: string, params?: Record<string, string | number>): string {
  return tolgee.t(key, params);
}
