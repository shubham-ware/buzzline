import type { BuzzlineWidgetConfig } from "@buzzline/shared";
import { CallManager } from "./call-manager";
import { injectStyles } from "./styles";

export class BuzzlineWidget {
  private config: BuzzlineWidgetConfig;
  private container: HTMLDivElement | null = null;
  private callManager: CallManager;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private callStartTime = 0;

  constructor(config: BuzzlineWidgetConfig) {
    this.config = config;
    this.callManager = new CallManager({
      apiKey: config.apiKey,
      serverUrl: (config as any).serverUrl || "https://api.buzzline.dev",
      onCallStart: (roomId) => { this.renderCallUI(); config.onCallStart?.(roomId); },
      onCallEnd: (roomId, duration) => { this.renderIdleUI(); config.onCallEnd?.(roomId, duration); },
      onError: (error) => config.onError?.(error),
      onRemoteStream: (stream) => {
        const el = document.getElementById("buzzline-remote-video") as HTMLVideoElement;
        if (el) el.srcObject = stream;
      },
    });
  }

  mount(): void {
    injectStyles(this.config.brandColor || "#6366f1");
    this.container = document.createElement("div");
    this.container.id = "buzzline-widget";
    this.container.className = `buzzline-widget buzzline-${this.config.position || "bottom-right"}`;
    document.body.appendChild(this.container);
    this.renderIdleUI();
  }

  private renderIdleUI(): void {
    if (!this.container) return;
    this.container.innerHTML = `
      <button class="buzzline-fab" aria-label="Start video call">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
      </button>`;
    this.container.querySelector(".buzzline-fab")?.addEventListener("click", () => this.startCall());
  }

  private renderCallUI(): void {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="buzzline-call-window">
        <div class="buzzline-call-header">
          <span class="buzzline-call-status">● Connected</span>
          <span class="buzzline-call-timer" id="buzzline-timer">00:00</span>
        </div>
        <div class="buzzline-video-container">
          <video id="buzzline-remote-video" autoplay playsinline></video>
          <video id="buzzline-local-video" autoplay playsinline muted class="buzzline-local-video"></video>
        </div>
        <div class="buzzline-call-controls">
          <button class="buzzline-btn buzzline-btn-mute" aria-label="Mute">🎤</button>
          <button class="buzzline-btn buzzline-btn-camera" aria-label="Camera">📹</button>
          <button class="buzzline-btn buzzline-btn-end" aria-label="End call">📞</button>
        </div>
      </div>`;

    this.container.querySelector(".buzzline-btn-end")?.addEventListener("click", () => this.endCall());
    this.container.querySelector(".buzzline-btn-mute")?.addEventListener("click", () => this.callManager.toggleMute());
    this.container.querySelector(".buzzline-btn-camera")?.addEventListener("click", () => this.callManager.toggleCamera());

    // Attach local video
    const localVid = document.getElementById("buzzline-local-video") as HTMLVideoElement;
    if (localVid && this.callManager.localStream) localVid.srcObject = this.callManager.localStream;

    // Start timer
    this.callStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
      const el = document.getElementById("buzzline-timer");
      if (el) el.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
    }, 1000);
  }

  async startCall(roomId?: string): Promise<string | null> {
    try { return await this.callManager.startCall(roomId); }
    catch (e) { this.config.onError?.(e as Error); return null; }
  }

  endCall(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    this.callManager.endCall();
  }

  destroy(): void {
    this.endCall();
    this.container?.remove();
    this.container = null;
    document.getElementById("buzzline-styles")?.remove();
  }
}
