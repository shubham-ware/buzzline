import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, UseGuards, Req } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { CreateRoomRequest, ApiResponse, CreateRoomResponse, PLAN_LIMITS, PlanName } from "@buzzline/shared";
import { ApiKeyGuard } from "../auth/api-key.guard";
import { UsageService } from "../usage/usage.service";
import { PrismaService } from "../prisma.service";

@Controller("rooms")
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly usageService: UsageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ApiKeyGuard)
  async create(@Req() req: any, @Body() body: Omit<CreateRoomRequest, "projectId">): Promise<ApiResponse<CreateRoomResponse>> {
    // Plan limit enforcement
    const user = await this.prisma.user.findUnique({ where: { id: req.project.userId } });
    if (user) {
      const plan = PLAN_LIMITS[user.plan as PlanName];
      if (plan && plan.minutesPerMonth !== Infinity) {
        const usage = await this.usageService.getCurrentMonthUsage(user.id);
        if (usage.totalMinutes >= plan.minutesPerMonth) {
          return {
            success: false,
            error: {
              code: "USAGE_LIMIT",
              message: `Monthly usage limit of ${plan.minutesPerMonth} minutes reached. Please upgrade your plan.`,
            },
          };
        }
      }
    }

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
