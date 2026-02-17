import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
import { UsageService } from "./usage.service";
import { ApiResponse, UsageCurrentResponse, UsageByProjectItem, UsageDailyItem } from "@buzzline/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("usage")
@UseGuards(JwtAuthGuard)
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get("current")
  async getCurrentUsage(@Req() req: any): Promise<ApiResponse<UsageCurrentResponse>> {
    const usage = await this.usageService.getCurrentMonthUsage(req.user.userId);
    return { success: true, data: usage };
  }

  @Get("by-project")
  async getUsageByProject(@Req() req: any): Promise<ApiResponse<UsageByProjectItem[]>> {
    const usage = await this.usageService.getUsageByProject(req.user.userId);
    return { success: true, data: usage };
  }

  @Get("daily")
  async getDailyUsage(
    @Req() req: any,
    @Query("days") days?: string,
  ): Promise<ApiResponse<UsageDailyItem[]>> {
    const numDays = days ? Math.min(Math.max(parseInt(days, 10) || 30, 1), 90) : 30;
    const usage = await this.usageService.getDailyUsage(req.user.userId, numDays);
    return { success: true, data: usage };
  }
}
