import type { FoxClawApp } from "./app.ts";
import {
  loadChannels,
  logoutWhatsApp,
  startWhatsAppLogin,
  waitWhatsAppLogin,
} from "./controllers/channels.ts";
import { loadConfig, saveConfig } from "./controllers/config.ts";

export async function handleWhatsAppStart(host: FoxClawApp, force: boolean) {
  await startWhatsAppLogin(host, force);
  await loadChannels(host, true);
}

export async function handleWhatsAppWait(host: FoxClawApp) {
  await waitWhatsAppLogin(host);
  await loadChannels(host, true);
}

export async function handleWhatsAppLogout(host: FoxClawApp) {
  await logoutWhatsApp(host);
  await loadChannels(host, true);
}

export async function handleChannelConfigSave(host: FoxClawApp) {
  await saveConfig(host);
  await loadConfig(host);
  await loadChannels(host, true);
}

export async function handleChannelConfigReload(host: FoxClawApp) {
  await loadConfig(host);
  await loadChannels(host, true);
}
