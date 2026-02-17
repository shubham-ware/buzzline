import { io, Socket } from "socket.io-client";
import { SignalingEvent } from "@buzzline/shared";

interface CallManagerConfig {
  apiKey: string;
  serverUrl: string;
  onCallStart: (roomId: string) => void;
  onCallEnd: (roomId: string, duration: number) => void;
  onError: (error: Error) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onPeerLeft?: () => void;
  onConnectionStateChange?: (state: string) => void;
}

export class CallManager {
  private config: CallManagerConfig;
  private socket: Socket | null = null;
  private pc: RTCPeerConnection | null = null;
  private currentRoomId: string | null = null;
  private currentToken: string | null = null;
  private remotePeerId: string | null = null;
  private callStartTime = 0;
  localStream: MediaStream | null = null;

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  constructor(config: CallManagerConfig) {
    this.config = config;
  }

  async startCall(roomId?: string): Promise<string> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        this.config.onError(new Error("Camera/microphone permission denied. Please allow access and try again."));
      } else if (error.name === "NotFoundError") {
        this.config.onError(new Error("No camera or microphone found on this device."));
      } else {
        this.config.onError(new Error(`Failed to access media devices: ${error.message}`));
      }
      throw err;
    }

    let room: { roomId: string; token: string };
    if (roomId) {
      room = await this.joinRoom(roomId);
    } else {
      room = await this.createRoom();
    }

    this.currentRoomId = room.roomId;
    this.currentToken = room.token;
    this.connectSignaling(room.roomId, room.token);
    return room.roomId;
  }

  private async createRoom(): Promise<{ roomId: string; token: string }> {
    const res = await fetch(`${this.config.serverUrl}/api/v1/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}` },
      body: JSON.stringify({ projectId: "default", maxParticipants: 2 }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message || "Failed to create room");
    }
    const result = await res.json();
    return result.data;
  }

  private async joinRoom(roomId: string): Promise<{ roomId: string; token: string }> {
    const res = await fetch(`${this.config.serverUrl}/api/v1/rooms/${roomId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message || "Failed to join room");
    }
    const result = await res.json();
    return result.data;
  }

  private connectSignaling(roomId: string, token: string): void {
    this.socket = io(`${this.config.serverUrl}/signaling`, { transports: ["websocket"] });

    this.socket.on("connect", () => {
      console.log("[Buzzline] Signaling connected");
      this.socket!.emit(SignalingEvent.JOIN_ROOM, { roomId, token });
    });

    this.socket.on("room-joined", (data: { roomId: string; peers: Array<{ peerId: string }> }) => {
      console.log("[Buzzline] Joined room, existing peers:", data.peers.length);
    });

    this.socket.on(SignalingEvent.PEER_JOINED, async (data: { peerId: string }) => {
      console.log("[Buzzline] Peer joined:", data.peerId);
      this.remotePeerId = data.peerId;
      await this.createPeerConnection();
      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);
      this.socket!.emit("offer", { targetPeerId: data.peerId, sdp: offer });
    });

    this.socket.on("offer", async (data: { peerId: string; sdp: RTCSessionDescriptionInit }) => {
      console.log("[Buzzline] Received offer from:", data.peerId);
      this.remotePeerId = data.peerId;
      await this.createPeerConnection();
      await this.pc!.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      this.socket!.emit("answer", { targetPeerId: data.peerId, sdp: answer });
    });

    this.socket.on("answer", async (data: { peerId: string; sdp: RTCSessionDescriptionInit }) => {
      console.log("[Buzzline] Received answer from:", data.peerId);
      if (this.pc) await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    });

    this.socket.on("ice-candidate", async (data: { peerId: string; candidate: RTCIceCandidateInit }) => {
      if (this.pc && data.candidate) {
        await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    this.socket.on(SignalingEvent.PEER_LEFT, (data: { peerId: string }) => {
      console.log("[Buzzline] Peer left:", data.peerId);
      this.remotePeerId = null;
      this.closePc();
      this.config.onPeerLeft?.();
    });

    this.socket.on(SignalingEvent.ERROR, (err: { code: string; message: string }) => {
      console.error("[Buzzline] Signaling error:", err);
      this.config.onError(new Error(err.message));
    });

    this.socket.on("disconnect", () => {
      console.log("[Buzzline] Signaling disconnected");
    });
  }

  private async createPeerConnection(): Promise<void> {
    if (this.pc) return;
    this.pc = new RTCPeerConnection(this.rtcConfig);

    this.localStream?.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

    this.pc.ontrack = (e) => {
      if (e.streams[0]) {
        this.config.onRemoteStream(e.streams[0]);
        if (this.callStartTime === 0) {
          this.callStartTime = Date.now();
          this.config.onCallStart(this.currentRoomId!);
        }
      }
    };

    this.pc.onicecandidate = (e) => {
      if (e.candidate && this.socket && this.remotePeerId) {
        this.socket.emit("ice-candidate", { targetPeerId: this.remotePeerId, candidate: e.candidate });
      }
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log("[Buzzline] Connection state:", state);
      this.config.onConnectionStateChange?.(state || "unknown");
      if (state === "disconnected" || state === "failed") {
        this.endCall();
      }
    };
  }

  private closePc(): void { this.pc?.close(); this.pc = null; }

  toggleMute(): boolean {
    const t = this.localStream?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; return t.enabled; }
    return false;
  }

  toggleCamera(): boolean {
    const t = this.localStream?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; return t.enabled; }
    return false;
  }

  endCall(): void {
    const duration = this.callStartTime ? Math.floor((Date.now() - this.callStartTime) / 1000) : 0;
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.closePc();
    this.remotePeerId = null;
    if (this.socket) { this.socket.emit(SignalingEvent.LEAVE_ROOM); this.socket.disconnect(); this.socket = null; }
    if (this.currentRoomId) { this.config.onCallEnd(this.currentRoomId, duration); this.currentRoomId = null; this.currentToken = null; }
    this.callStartTime = 0;
  }

  destroy(): void { this.endCall(); }
}
