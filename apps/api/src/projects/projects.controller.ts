import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { ApiResponse } from "@buzzline/shared";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: { userId: string; name: string }): ApiResponse {
    return { success: true, data: this.projectsService.createProject(body.userId, body.name) };
  }

  @Get("user/:userId")
  getUserProjects(@Param("userId") userId: string): ApiResponse {
    return { success: true, data: this.projectsService.getUserProjects(userId) };
  }

  @Get(":id")
  getProject(@Param("id") id: string): ApiResponse {
    return { success: true, data: this.projectsService.getProject(id) };
  }

  @Post(":id/rotate-key")
  rotateKey(@Param("id") id: string): ApiResponse {
    return { success: true, data: { apiKey: this.projectsService.rotateApiKey(id) } };
  }
}
