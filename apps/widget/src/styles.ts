export function injectStyles(brandColor: string): void {
  if (document.getElementById("buzzline-styles")) return;
  const style = document.createElement("style");
  style.id = "buzzline-styles";
  style.textContent = `
    .buzzline-widget { position: fixed; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .buzzline-bottom-right { bottom: 24px; right: 24px; }
    .buzzline-bottom-left { bottom: 24px; left: 24px; }
    .buzzline-top-right { top: 24px; right: 24px; }
    .buzzline-top-left { top: 24px; left: 24px; }
    .buzzline-fab { width: 56px; height: 56px; border-radius: 50%; border: none; background: ${brandColor}; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s, box-shadow 0.2s; }
    .buzzline-fab:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
    .buzzline-call-window { width: 340px; border-radius: 16px; overflow: hidden; background: #1a1a2e; box-shadow: 0 8px 32px rgba(0,0,0,0.3); animation: buzzline-in 0.3s ease; }
    @keyframes buzzline-in { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .buzzline-call-header { display: flex; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.05); }
    .buzzline-call-status { color: #4ade80; font-size: 13px; font-weight: 500; }
    .buzzline-call-timer { color: rgba(255,255,255,0.7); font-size: 13px; font-variant-numeric: tabular-nums; }
    .buzzline-video-container { position: relative; width: 100%; aspect-ratio: 4/3; background: #0f0f23; }
    .buzzline-video-container video { width: 100%; height: 100%; object-fit: cover; }
    .buzzline-local-video { position: absolute; bottom: 12px; right: 12px; width: 100px; height: 75px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.2); }
    .buzzline-call-controls { display: flex; justify-content: center; gap: 16px; padding: 16px; }
    .buzzline-btn { width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .buzzline-btn-mute, .buzzline-btn-camera { background: rgba(255,255,255,0.1); color: white; }
    .buzzline-btn-mute:hover, .buzzline-btn-camera:hover { background: rgba(255,255,255,0.2); }
    .buzzline-btn-end { background: #ef4444; color: white; }
    .buzzline-btn-end:hover { background: #dc2626; }
    .buzzline-btn-toggled { background: #ef4444 !important; }
    .buzzline-btn-toggled:hover { background: #dc2626 !important; }
  `;
  document.head.appendChild(style);
}
