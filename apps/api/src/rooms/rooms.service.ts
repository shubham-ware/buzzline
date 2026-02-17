import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { PeerInfo, CreateRoomRequest, CreateRoomResponse } from "@buzzline/shared";
import { PrismaService } from "../prisma.service";

@Injectable()
export class RoomsService {
  // Peer tracking stays in-memory (ephemeral, Redis in Phase 2)
  private roomPeers = new Map<string, Map<string, PeerInfo>>();

  constructor(private readonly prisma: PrismaService) {}

  async createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
    const token = uuidv4();
    const tokenExpiresAt = request.expiresInMinutes
      ? new Date(Date.now() + request.expiresInMinutes * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);

    const room = await this.prisma.room.create({
      data: {
        projectId: request.projectId,
        maxParticipants: request.maxParticipants || 2,
        metadata: (request.metadata as any) ?? undefined,
        token,
        tokenExpiresAt,
      },
    });

    this.roomPeers.set(room.id, new Map());
    return { roomId: room.id, token, expiresAt: tokenExpiresAt.toISOString() };
  }

  async getRoom(roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException(`Room ${roomId} not found`);
    return room;
  }

  async validateToken(token: string): Promise<string | null> {
    const room = await this.prisma.room.findUnique({ where: { token } });
    if (!room) return null;
    if (new Date() > room.tokenExpiresAt) return null;
    return room.id;
  }

  addPeer(roomId: string, peerId: string, maxParticipants: number, displayName?: string): PeerInfo {
    let peers = this.roomPeers.get(roomId);
    if (!peers) { peers = new Map(); this.roomPeers.set(roomId, peers); }
    if (peers.size >= maxParticipants) throw new BadRequestException("Room is full");

    const peer: PeerInfo = { peerId, displayName, producers: [] };
    peers.set(peerId, peer);

    // Mark room active on first peer
    if (peers.size === 1) {
      this.prisma.room.update({ where: { id: roomId }, data: { status: "active" } }).catch(() => {});
    }
    return peer;
  }

  removePeer(roomId: string, peerId: string): void {
    const peers = this.roomPeers.get(roomId);
    if (peers) {
      peers.delete(peerId);
      if (peers.size === 0) {
        this.prisma.room.update({ where: { id: roomId }, data: { status: "closed", closedAt: new Date() } }).catch(() => {});
      }
    }
  }

  getPeers(roomId: string): PeerInfo[] {
    const peers = this.roomPeers.get(roomId);
    return peers ? Array.from(peers.values()) : [];
  }

  async joinRoom(roomId: string): Promise<CreateRoomResponse> {
    const room = await this.getRoom(roomId);
    if (room.status === "closed") throw new BadRequestException("Room is closed");
    const peers = this.roomPeers.get(roomId);
    if (peers && peers.size >= room.maxParticipants) throw new BadRequestException("Room is full");

    const token = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Update room token for the new participant
    await this.prisma.room.update({
      where: { id: roomId },
      data: { token, tokenExpiresAt },
    });

    return { roomId, token, expiresAt: tokenExpiresAt.toISOString() };
  }
}
