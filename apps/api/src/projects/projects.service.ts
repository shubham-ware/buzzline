import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma.service";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(userId: string, name: string, settings?: Record<string, any>) {
    const apiKey = `bz_${randomBytes(24).toString("hex")}`;
    const defaultSettings = { maxParticipants: 2, recordingEnabled: false, brandColor: "#6366f1", position: "bottom-right", ...settings };

    return this.prisma.project.create({
      data: { name, userId, apiKey, settings: defaultSettings },
    });
  }

  async getProject(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async getProjectByApiKey(apiKey: string) {
    return this.prisma.project.findUnique({ where: { apiKey } });
  }

  async getUserProjects(userId: string) {
    return this.prisma.project.findMany({ where: { userId } });
  }

  async rotateApiKey(projectId: string) {
    const project = await this.getProject(projectId);
    const newApiKey = `bz_${randomBytes(24).toString("hex")}`;
    await this.prisma.project.update({ where: { id: project.id }, data: { apiKey: newApiKey } });
    return newApiKey;
  }
}
