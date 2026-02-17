import { Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { Project, ProjectSettings } from "@buzzline/shared";
import { randomBytes } from "crypto";

@Injectable()
export class ProjectsService {
  private projects = new Map<string, Project>();
  private apiKeyIndex = new Map<string, string>();

  createProject(userId: string, name: string, settings?: Partial<ProjectSettings>): Project {
    const id = uuidv4();
    const apiKey = `bz_${randomBytes(24).toString("hex")}`;
    const project: Project = {
      id, name, userId, apiKey, allowedOrigins: ["*"], createdAt: new Date(),
      settings: { maxParticipants: 2, recordingEnabled: false, brandColor: "#6366f1", position: "bottom-right", ...settings },
    };
    this.projects.set(id, project);
    this.apiKeyIndex.set(apiKey, id);
    return project;
  }

  getProject(id: string): Project {
    const project = this.projects.get(id);
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  getProjectByApiKey(apiKey: string): Project | null {
    const projectId = this.apiKeyIndex.get(apiKey);
    return projectId ? this.projects.get(projectId) || null : null;
  }

  getUserProjects(userId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  rotateApiKey(projectId: string): string {
    const project = this.getProject(projectId);
    this.apiKeyIndex.delete(project.apiKey);
    const newApiKey = `bz_${randomBytes(24).toString("hex")}`;
    project.apiKey = newApiKey;
    this.projects.set(projectId, project);
    this.apiKeyIndex.set(newApiKey, projectId);
    return newApiKey;
  }
}
