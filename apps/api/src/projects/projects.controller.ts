import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, UseGuards, Req } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { ApiResponse } from "@buzzline/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() body: { name: string }): Promise<ApiResponse> {
    const project = await this.projectsService.createProject(req.user.userId, body.name);
    return { success: true, data: project };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyProjects(@Req() req: any): Promise<ApiResponse> {
    const projects = await this.projectsService.getUserProjects(req.user.userId);
    return { success: true, data: projects };
  }

  @Get(":id")
  async getProject(@Param("id") id: string): Promise<ApiResponse> {
    const project = await this.projectsService.getProject(id);
    return { success: true, data: project };
  }

  @Post(":id/rotate-key")
  @UseGuards(JwtAuthGuard)
  async rotateKey(@Param("id") id: string): Promise<ApiResponse> {
    const apiKey = await this.projectsService.rotateApiKey(id);
    return { success: true, data: { apiKey } };
  }
}
