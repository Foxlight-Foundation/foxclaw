import { vi } from "vitest";
import { installChromeUserDataDirHooks } from "./chrome-user-data-dir.test-harness.js";

const chromeUserDataDir = { dir: "/tmp/foxclaw" };
installChromeUserDataDirHooks(chromeUserDataDir);

vi.mock("./chrome.js", () => ({
  isChromeCdpReady: vi.fn(async () => true),
  isChromeReachable: vi.fn(async () => true),
  launchFoxClawChrome: vi.fn(async () => {
    throw new Error("unexpected launch");
  }),
  resolveFoxClawUserDataDir: vi.fn(() => chromeUserDataDir.dir),
  stopFoxClawChrome: vi.fn(async () => {}),
}));
