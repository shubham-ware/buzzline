import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, UseGuards, Req } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { CreateRoomRequest, ApiResponse, CreateRoomResponse } from "@buzzline/shared";
import { ApiKeyGuard } from "../auth/api-key.guard";

@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ApiKeyGuard)
  async create(@Req() req: any, @Body() body: Omit<CreateRoomRequest, "projectId">): Promise<ApiResponse<CreateRoomResponse>> {
    const room = await this.roomsService.createRoom({ ...body, projectId: req.project.id });
    return { success: true, data: room };
  }

  @Get(":id")
  async getRoom(@Param("id") id: string): Promise<ApiResponse> {
    const room = await this.roomsService.getRoom(id);
    const peers = this.roomsService.getPeers(id);
    return { success: true, data: { ...room, participants: peers.length, peers } };
  }

  @Get(":id/peers")
  getPeers(@Param("id") id: string): ApiResponse {
    return { success: true, data: this.roomsService.getPeers(id) };
  }

  @Post(":id/join")
  @HttpCode(HttpStatus.OK)
  async joinRoom(@Param("id") id: string): Promise<ApiResponse<CreateRoomResponse>> {
    const result = await this.roomsService.joinRoom(id);
    return { success: true, data: result };
  }
}
