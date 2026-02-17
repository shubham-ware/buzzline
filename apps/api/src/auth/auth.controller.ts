import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiResponse } from "@buzzline/shared";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() body: { email: string; password: string; name: string }): Promise<ApiResponse> {
    const result = await this.authService.signup(body.email, body.password, body.name);
    return { success: true, data: result };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }): Promise<ApiResponse> {
    const result = await this.authService.login(body.email, body.password);
    return { success: true, data: result };
  }
}
