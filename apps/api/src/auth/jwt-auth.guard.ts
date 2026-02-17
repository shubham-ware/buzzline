import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) throw new UnauthorizedException("Missing authorization token");

    const token = authHeader.slice(7);
    if (token.startsWith("bz_")) throw new UnauthorizedException("Use a JWT token, not an API key");

    request.user = this.authService.verifyToken(token);
    return true;
  }
}
