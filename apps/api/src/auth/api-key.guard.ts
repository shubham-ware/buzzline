import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ProjectsService } from "../projects/projects.service";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly projectsService: ProjectsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["x-api-key"] || request.headers.authorization;

    let apiKey: string | undefined;

    if (request.headers["x-api-key"]) {
      apiKey = request.headers["x-api-key"];
    } else if (authHeader?.startsWith("Bearer bz_")) {
      apiKey = authHeader.slice(7);
    }

    if (!apiKey?.startsWith("bz_")) {
      throw new UnauthorizedException("Missing or invalid API key. Use a bz_ prefixed key.");
    }

    const project = await this.projectsService.getProjectByApiKey(apiKey);
    if (!project) {
      throw new UnauthorizedException("Invalid API key");
    }

    // Validate allowed origins
    const origin = request.headers.origin;
    const allowedOrigins = project.allowedOrigins as string[];
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes("*")) {
      if (!allowedOrigins.includes(origin)) {
        throw new UnauthorizedException(`Origin ${origin} is not allowed for this project`);
      }
    }

    request.project = project;
    return true;
  }
}
