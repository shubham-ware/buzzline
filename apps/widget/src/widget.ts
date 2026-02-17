import type { BuzzlineWidgetConfig } from "@buzzline/shared";
import { CallManager } from "./call-manager";
import { injectStyles } from "./styles";

export class BuzzlineWidget {
  private config: BuzzlineWidgetConfig;
  private container: HTMLDivElement | null = null;
  private callManager: CallManager;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private callStartTime = 0;
  private isMuted = false;
  private isCameraOff = false;

  constructor(config: BuzzlineWidgetConfig) {
    this.config = config;
    this.callManager = new CallManager({
      apiKey: config.apiKey,
      serverUrl: (config as any).serverUrl || "https://api.buzzline.dev",
      onCallStart: (roomId) => {
        this.renderCallUI();
        config.onCallStart?.(roomId);
      },
      onCallEnd: (roomId, duration) => {
        this.stopTimer();
        this.renderIdleUI();
        config.onCallEnd?.(roomId, duration);
      },
      onError: (error) => {
        console.error("[Buzzline]", error.message);
        config.onError?.(error);
      },
      onRemoteStream: (stream) => {
        const el = document.getElementById("buzzline-remote-video") as HTMLVideoElement;
        if (el) el.srcObject = stream;
      },
      onPeerLeft: () => {
        this.stopTimer();
        this.renderIdleUI();
      },
      onConnectionStateChange: (state) => {
        const statusEl = this.container?.querySelector(".buzzline-call-status");
        if (!statusEl) return;
        if (state === "connected") {
          statusEl.innerHTML = '<span style="color:#4ade80">● Connected</span>';
        } else if (state === "connecting" || state === "new") {
          statusEl.innerHTML = '<span style="color:#fbbf24">● Connecting...</span>';
        } else if (state === "disconnected" || state === "failed") {
          statusEl.innerHTML = '<span style="color:#ef4444">● Disconnected</span>';
        }
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
    this.isMuted = false;
    this.isCameraOff = false;
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
          <span class="buzzline-call-status"><span style="color:#4ade80">● Connected</span></span>
          <span class="buzzline-call-timer" id="buzzline-timer">00:00</span>
        </div>
        <div class="buzzline-video-container">
          <video id="buzzline-remote-video" autoplay playsinline></video>
          <video id="buzzline-local-video" autoplay playsinline muted class="buzzline-local-video"></video>
        </div>
        <div class="buzzline-call-controls">
          <button class="buzzline-btn buzzline-btn-mute" aria-label="Mute" title="Mute microphone">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <button class="buzzline-btn buzzline-btn-camera" aria-label="Camera" title="Turn off camera">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
          <button class="buzzline-btn buzzline-btn-end" aria-label="End call" title="End call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22.5 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.62 4.18 2 2 0 0 1 4.6 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.59 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7a2 2 0 0 1 1.72 2.01z"></path>
              <line x1="1" y1="1" x2="23" y2="23" stroke="#ef4444" stroke-width="2.5"></line>
            </svg>
          </button>
        </div>
      </div>`;

    this.container.querySelector(".buzzline-btn-end")?.addEventListener("click", () => this.endCall());
    this.container.querySelector(".buzzline-btn-mute")?.addEventListener("click", () => this.handleToggleMute());
    this.container.querySelector(".buzzline-btn-camera")?.addEventListener("click", () => this.handleToggleCamera());

    const localVid = document.getElementById("buzzline-local-video") as HTMLVideoElement;
    if (localVid && this.callManager.localStream) localVid.srcObject = this.callManager.localStream;

    this.callStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
      const el = document.getElementById("buzzline-timer");
      if (el) el.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
    }, 1000);
  }

  private handleToggleMute(): void {
    const enabled = this.callManager.toggleMute();
    this.isMuted = !enabled;
    const btn = this.container?.querySelector(".buzzline-btn-mute");
    if (btn) {
      btn.classList.toggle("buzzline-btn-toggled", this.isMuted);
      btn.setAttribute("title", this.isMuted ? "Unmute microphone" : "Mute microphone");
    }
  }

  private handleToggleCamera(): void {
    const enabled = this.callManager.toggleCamera();
    this.isCameraOff = !enabled;
    const btn = this.container?.querySelector(".buzzline-btn-camera");
    if (btn) {
      btn.classList.toggle("buzzline-btn-toggled", this.isCameraOff);
      btn.setAttribute("title", this.isCameraOff ? "Turn on camera" : "Turn off camera");
    }
  }

  private stopTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  async startCall(roomId?: string): Promise<string | null> {
    try { return await this.callManager.startCall(roomId); }
    catch (e) { this.config.onError?.(e as Error); return null; }
  }

  endCall(): void {
    this.stopTimer();
    this.callManager.endCall();
  }

  destroy(): void {
    this.endCall();
    this.container?.remove();
    this.container = null;
    document.getElementById("buzzline-styles")?.remove();
  }
}
