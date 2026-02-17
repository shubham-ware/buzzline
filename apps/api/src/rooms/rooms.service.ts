import { Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { Room, CreateRoomRequest, CreateRoomResponse, PeerInfo } from "@buzzline/shared";

@Injectable()
export class RoomsService {
  private rooms = new Map<string, Room>();
  private roomPeers = new Map<string, Map<string, PeerInfo>>();
  private tokens = new Map<string, { roomId: string; expiresAt: Date }>();

  createRoom(request: CreateRoomRequest): CreateRoomResponse {
    const roomId = uuidv4();
    const token = uuidv4();
    const now = new Date();
    const expiresAt = request.expiresInMinutes
      ? new Date(now.getTime() + request.expiresInMinutes * 60 * 1000)
      : new Date(now.getTime() + 60 * 60 * 1000);

    const room: Room = {
      id: roomId, projectId: request.projectId, createdAt: now, expiresAt,
      maxParticipants: request.maxParticipants || 2, status: "waiting", metadata: request.metadata,
    };

    this.rooms.set(roomId, room);
    this.roomPeers.set(roomId, new Map());
    this.tokens.set(token, { roomId, expiresAt });
    return { roomId, token, expiresAt: expiresAt.toISOString() };
  }

  getRoom(roomId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) throw new NotFoundException(`Room ${roomId} not found`);
    return room;
  }

  validateToken(token: string): string | null {
    const entry = this.tokens.get(token);
    if (!entry) return null;
    if (new Date() > entry.expiresAt) { this.tokens.delete(token); return null; }
    return entry.roomId;
  }

  addPeer(roomId: string, peerId: string, displayName?: string): PeerInfo {
    const peers = this.roomPeers.get(roomId);
    if (!peers) throw new NotFoundException(`Room ${roomId} not found`);
    const room = this.getRoom(roomId);
    if (peers.size >= room.maxParticipants) throw new Error("Room is full");

    const peer: PeerInfo = { peerId, displayName, producers: [] };
    peers.set(peerId, peer);
    if (room.status === "waiting") { room.status = "active"; this.rooms.set(roomId, room); }
    return peer;
  }

  removePeer(roomId: string, peerId: string): void {
    const peers = this.roomPeers.get(roomId);
    if (peers) {
      peers.delete(peerId);
      if (peers.size === 0) {
        const room = this.rooms.get(roomId);
        if (room) { room.status = "closed"; this.rooms.set(roomId, room); }
      }
    }
  }

  getPeers(roomId: string): PeerInfo[] {
    const peers = this.roomPeers.get(roomId);
    return peers ? Array.from(peers.values()) : [];
  }

  joinRoom(roomId: string): CreateRoomResponse {
    const room = this.getRoom(roomId);
    if (room.status === "closed") throw new Error("Room is closed");
    const peers = this.roomPeers.get(roomId);
    if (peers && peers.size >= room.maxParticipants) throw new Error("Room is full");

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    this.tokens.set(token, { roomId, expiresAt });
    return { roomId, token, expiresAt: expiresAt.toISOString() };
  }
}
