import { BuzzlineWidget } from "./widget";
import type { BuzzlineWidgetConfig } from "@buzzline/shared";

class BuzzlineSDK {
  private widget: BuzzlineWidget | null = null;

  init(config: BuzzlineWidgetConfig): void {
    if (this.widget) { console.warn("[Buzzline] Already initialized."); return; }
    if (!config.apiKey) { console.error("[Buzzline] apiKey is required"); return; }
    this.widget = new BuzzlineWidget(config);
    this.widget.mount();
    console.log("[Buzzline] Widget initialized 🐝");
    config.onReady?.();
  }

  async startCall(roomId?: string): Promise<string | null> {
    if (!this.widget) { console.error("[Buzzline] Not initialized."); return null; }
    return this.widget.startCall(roomId);
  }

  endCall(): void { this.widget?.endCall(); }

  destroy(): void { this.widget?.destroy(); this.widget = null; }
}

const buzzline = new BuzzlineSDK();
export default buzzline;
if (typeof window !== "undefined") { (window as any).Buzzline = buzzline; }
