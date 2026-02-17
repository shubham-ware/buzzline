import { io, Socket } from "socket.io-client";
import { SignalingEvent } from "@buzzline/shared";

interface CallManagerConfig {
  apiKey: string;
  serverUrl: string;
  onCallStart: (roomId: string) => void;
  onCallEnd: (roomId: string, duration: number) => void;
  onError: (error: Error) => void;
  onRemoteStream: (stream: MediaStream) => void;
}

export class CallManager {
  private config: CallManagerConfig;
  private socket: Socket | null = null;
  private pc: RTCPeerConnection | null = null;
  private currentRoomId: string | null = null;
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
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const room = roomId ? { roomId, token: "TODO" } : await this.createRoom();
    this.currentRoomId = room.roomId;
    this.connectSignaling(room.roomId, room.token);
    this.callStartTime = Date.now();
    this.config.onCallStart(room.roomId);
    return room.roomId;
  }

  private async createRoom(): Promise<{ roomId: string; token: string }> {
    const res = await fetch(`${this.config.serverUrl}/api/v1/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}` },
      body: JSON.stringify({ projectId: "default", maxParticipants: 2 }),
    });
    if (!res.ok) throw new Error("Failed to create room");
    const result = await res.json();
    return result.data;
  }

  private connectSignaling(roomId: string, token: string): void {
    this.socket = io(`${this.config.serverUrl}/signaling`, { transports: ["websocket"] });

    this.socket.on("connect", () => {
      this.socket!.emit(SignalingEvent.JOIN_ROOM, { roomId, token });
    });

    this.socket.on(SignalingEvent.PEER_JOINED, async (data: any) => {
      await this.ensurePeerConnection();
      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);
      this.socket!.emit("offer", { targetPeerId: data.peerId, sdp: offer });
    });

    this.socket.on("offer", async (data: any) => {
      await this.ensurePeerConnection();
      await this.pc!.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      this.socket!.emit("answer", { targetPeerId: data.peerId, sdp: answer });
    });

    this.socket.on("answer", async (data: any) => {
      await this.pc!.setRemoteDescription(new RTCSessionDescription(data.sdp));
    });

    this.socket.on("ice-candidate", async (data: any) => {
      if (this.pc && data.candidate) await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    this.socket.on(SignalingEvent.PEER_LEFT, () => this.closePc());
    this.socket.on(SignalingEvent.ERROR, (err: any) => this.config.onError(new Error(err.message)));
  }

  private async ensurePeerConnection(): Promise<void> {
    if (this.pc) return;
    this.pc = new RTCPeerConnection(this.rtcConfig);
    this.localStream?.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));
    this.pc.ontrack = (e) => { if (e.streams[0]) this.config.onRemoteStream(e.streams[0]); };
    this.pc.onicecandidate = (e) => {
      if (e.candidate && this.socket) this.socket.emit("ice-candidate", { targetPeerId: "broadcast", candidate: e.candidate });
    };
    this.pc.onconnectionstatechange = () => {
      const s = this.pc?.connectionState;
      if (s === "disconnected" || s === "failed") this.endCall();
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
    if (this.socket) { this.socket.emit(SignalingEvent.LEAVE_ROOM); this.socket.disconnect(); this.socket = null; }
    if (this.currentRoomId) { this.config.onCallEnd(this.currentRoomId, duration); this.currentRoomId = null; }
    this.callStartTime = 0;
  }

  destroy(): void { this.endCall(); }
}
