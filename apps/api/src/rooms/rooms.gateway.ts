import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RoomsService } from "./rooms.service";
import { SignalingEvent, JoinRoomPayload } from "@buzzline/shared";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/signaling" })
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private socketRooms = new Map<string, string>();

  constructor(private readonly roomsService: RoomsService) {}

  handleConnection(client: Socket) { console.log(`🔌 Connected: ${client.id}`); }

  handleDisconnect(client: Socket) {
    const roomId = this.socketRooms.get(client.id);
    if (roomId) {
      this.roomsService.removePeer(roomId, client.id);
      this.socketRooms.delete(client.id);
      client.to(roomId).emit(SignalingEvent.PEER_LEFT, { peerId: client.id });
    }
  }

  @SubscribeMessage(SignalingEvent.JOIN_ROOM)
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomPayload) {
    const { roomId, token, displayName } = payload;
    const validRoomId = this.roomsService.validateToken(token);
    if (!validRoomId || validRoomId !== roomId) {
      client.emit(SignalingEvent.ERROR, { code: "INVALID_TOKEN", message: "Invalid or expired token" });
      return;
    }
    try {
      this.roomsService.addPeer(roomId, client.id, displayName);
      client.join(roomId);
      this.socketRooms.set(client.id, roomId);
      const peers = this.roomsService.getPeers(roomId).filter(p => p.peerId !== client.id);
      client.emit("room-joined", { roomId, peers });
      client.to(roomId).emit(SignalingEvent.PEER_JOINED, { peerId: client.id, displayName });
    } catch (error: any) {
      client.emit(SignalingEvent.ERROR, { code: "JOIN_FAILED", message: error.message });
    }
  }

  @SubscribeMessage(SignalingEvent.LEAVE_ROOM)
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const roomId = this.socketRooms.get(client.id);
    if (roomId) {
      this.roomsService.removePeer(roomId, client.id);
      client.leave(roomId);
      this.socketRooms.delete(client.id);
      client.to(roomId).emit(SignalingEvent.PEER_LEFT, { peerId: client.id });
    }
  }

  @SubscribeMessage("offer")
  handleOffer(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetPeerId: string; sdp: any }) {
    this.server.to(payload.targetPeerId).emit("offer", { peerId: client.id, sdp: payload.sdp });
  }

  @SubscribeMessage("answer")
  handleAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetPeerId: string; sdp: any }) {
    this.server.to(payload.targetPeerId).emit("answer", { peerId: client.id, sdp: payload.sdp });
  }

  @SubscribeMessage("ice-candidate")
  handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetPeerId: string; candidate: any }) {
    this.server.to(payload.targetPeerId).emit("ice-candidate", { peerId: client.id, candidate: payload.candidate });
  }
}
