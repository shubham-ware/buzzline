import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { UsageCurrentResponse, UsageByProjectItem, UsageDailyItem } from "@buzzline/shared";

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentMonthUsage(userId: string): Promise<UsageCurrentResponse> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prisma.client.$queryRaw<[{ total: bigint }]>`
      SELECT COALESCE(SUM(ur.duration_seconds), 0) as total
      FROM usage_records ur
      JOIN rooms r ON ur.room_id = r.id
      JOIN projects p ON r.project_id = p.id
      WHERE p.user_id = ${userId}
        AND ur.created_at >= ${startOfMonth}
    `;

    const totalSeconds = Number(result[0]?.total || 0);
    return { totalSeconds, totalMinutes: Math.ceil(totalSeconds / 60) };
  }

  async getUsageByProject(userId: string): Promise<UsageByProjectItem[]> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const results = await this.prisma.client.$queryRaw<
      Array<{ project_id: string; project_name: string; total_seconds: bigint; room_count: bigint }>
    >`
      SELECT
        p.id as project_id,
        p.name as project_name,
        COALESCE(SUM(ur.duration_seconds), 0) as total_seconds,
        COUNT(DISTINCT ur.room_id) as room_count
      FROM projects p
      LEFT JOIN rooms r ON r.project_id = p.id AND r.created_at >= ${startOfMonth}
      LEFT JOIN usage_records ur ON ur.room_id = r.id AND ur.created_at >= ${startOfMonth}
      WHERE p.user_id = ${userId}
      GROUP BY p.id, p.name
      ORDER BY total_seconds DESC
    `;

    return results.map((r) => ({
      projectId: r.project_id,
      projectName: r.project_name,
      totalSeconds: Number(r.total_seconds),
      totalMinutes: Math.ceil(Number(r.total_seconds) / 60),
      roomCount: Number(r.room_count),
    }));
  }

  async getDailyUsage(userId: string, days: number = 30): Promise<UsageDailyItem[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const results = await this.prisma.client.$queryRaw<
      Array<{ date: Date; total_seconds: bigint; room_count: bigint }>
    >`
      SELECT
        DATE(ur.created_at) as date,
        COALESCE(SUM(ur.duration_seconds), 0) as total_seconds,
        COUNT(DISTINCT ur.room_id) as room_count
      FROM usage_records ur
      JOIN rooms r ON ur.room_id = r.id
      JOIN projects p ON r.project_id = p.id
      WHERE p.user_id = ${userId}
        AND ur.created_at >= ${startDate}
      GROUP BY DATE(ur.created_at)
      ORDER BY date ASC
    `;

    const dailyMap = new Map(
      results.map((r) => [
        new Date(r.date).toISOString().split("T")[0],
        { totalSeconds: Number(r.total_seconds), roomCount: Number(r.room_count) },
      ]),
    );

    const output: UsageDailyItem[] = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = dailyMap.get(dateStr);
      output.push({
        date: dateStr,
        totalSeconds: entry?.totalSeconds || 0,
        totalMinutes: Math.ceil((entry?.totalSeconds || 0) / 60),
        roomCount: entry?.roomCount || 0,
      });
    }

    return output;
  }
}
