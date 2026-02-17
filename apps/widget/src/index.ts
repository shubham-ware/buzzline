import { BuzzlineWidget } from "./widget";
import type { BuzzlineWidgetConfig } from "@buzzline/shared";

class BuzzlineSDK {
  private widget: BuzzlineWidget | null = null;
  private errorHandler: ((error: Error) => void) | null = null;

  init(config: BuzzlineWidgetConfig): void {
    if (this.widget) { console.warn("[Buzzline] Already initialized."); return; }
    if (!config.apiKey) { console.error("[Buzzline] apiKey is required"); return; }

    this.errorHandler = config.onError || null;

    try {
      this.widget = new BuzzlineWidget(config);
      this.widget.mount();
      console.log("[Buzzline] Widget initialized 🐝");
      config.onReady?.();
    } catch (err) {
      console.error("[Buzzline] Failed to initialize:", err);
      this.errorHandler?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async startCall(roomId?: string): Promise<string | null> {
    if (!this.widget) { console.error("[Buzzline] Not initialized."); return null; }
    try {
      return await this.widget.startCall(roomId);
    } catch (err) {
      console.error("[Buzzline] startCall error:", err);
      this.errorHandler?.(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }

  endCall(): void { this.widget?.endCall(); }

  destroy(): void { this.widget?.destroy(); this.widget = null; }
}

const buzzline = new BuzzlineSDK();
export default buzzline;

if (typeof window !== "undefined") {
  (window as any).Buzzline = buzzline;

  // Catch unhandled widget errors — never crash the host page
  window.addEventListener("error", (event) => {
    if (event.filename?.includes("buzzline")) {
      console.error("[Buzzline] Uncaught error:", event.message);
      event.preventDefault();
    }
  });
}
