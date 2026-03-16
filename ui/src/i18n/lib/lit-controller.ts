import type { ReactiveController, ReactiveControllerHost } from "lit";
import { tolgee } from "../tolgee.ts";

export class I18nController implements ReactiveController {
  private host: ReactiveControllerHost;
  private unsubscribe?: { unsubscribe: () => void };

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.unsubscribe = tolgee.on("update", () => {
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    this.unsubscribe?.unsubscribe();
  }
}
