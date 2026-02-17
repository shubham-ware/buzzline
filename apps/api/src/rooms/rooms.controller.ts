import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { CreateRoomRequest, ApiResponse, CreateRoomResponse } from "@buzzline/shared";

@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateRoomRequest): ApiResponse<CreateRoomResponse> {
    const room = this.roomsService.createRoom(body);
    return { success: true, data: room };
  }

  @Get(":id")
  getRoom(@Param("id") id: string): ApiResponse {
    const room = this.roomsService.getRoom(id);
    const peers = this.roomsService.getPeers(id);
    return { success: true, data: { ...room, participants: peers.length, peers } };
  }

  @Get(":id/peers")
  getPeers(@Param("id") id: string): ApiResponse {
    return { success: true, data: this.roomsService.getPeers(id) };
  }
}
