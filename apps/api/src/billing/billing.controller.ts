import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, Headers } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { ApiResponse } from "@buzzline/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post("create-checkout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @Req() req: any,
    @Body() body: { plan: "starter" | "growth" },
  ): Promise<ApiResponse<{ url: string }>> {
    const result = await this.billingService.createCheckoutSession(req.user.userId, body.plan);
    return { success: true, data: result };
  }

  @Post("portal")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async createPortal(@Req() req: any): Promise<ApiResponse<{ url: string }>> {
    const result = await this.billingService.createPortalSession(req.user.userId);
    return { success: true, data: result };
  }

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() req: any,
  ): Promise<{ received: true }> {
    await this.billingService.handleWebhook(req.rawBody, signature);
    return { received: true };
  }
}
