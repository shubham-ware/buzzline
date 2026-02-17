import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "../prisma.service";
import { PlanName } from "@buzzline/shared";

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>("STRIPE_SECRET_KEY");
    if (key) {
      this.stripe = new Stripe(key);
    }
  }

  private requireStripe(): Stripe {
    if (!this.stripe) throw new BadRequestException("Billing is not configured");
    return this.stripe;
  }

  async createCheckoutSession(userId: string, plan: "starter" | "growth"): Promise<{ url: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.requireStripe().customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const priceId = plan === "starter"
      ? this.config.get<string>("STRIPE_STARTER_PRICE_ID")
      : this.config.get<string>("STRIPE_GROWTH_PRICE_ID");

    if (!priceId) throw new BadRequestException(`Price not configured for plan: ${plan}`);

    const dashboardUrl = this.config.get<string>("DASHBOARD_URL", "http://localhost:3000");

    const session = await this.requireStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${dashboardUrl}/dashboard?upgraded=true`,
      cancel_url: `${dashboardUrl}/dashboard/usage`,
      metadata: { userId: user.id, plan },
    });

    return { url: session.url! };
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) throw new BadRequestException("No active subscription found");

    const dashboardUrl = this.config.get<string>("DASHBOARD_URL", "http://localhost:3000");

    const session = await this.requireStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${dashboardUrl}/dashboard/usage`,
    });

    return { url: session.url };
  }

  async handleWebhook(body: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET", "");
    let event: Stripe.Event;

    try {
      event = this.requireStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${(err as Error).message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as PlanName | undefined;
        if (userId && plan) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { plan, stripeCustomerId: session.customer as string },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await this.requireStripe().customers.retrieve(subscription.customer as string);
        if (customer && !customer.deleted) {
          const userId = customer.metadata.userId;
          if (userId) {
            const priceId = subscription.items.data[0]?.price.id;
            const plan = this.priceIdToPlan(priceId);
            if (plan) {
              await this.prisma.user.update({ where: { id: userId }, data: { plan } });
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await this.requireStripe().customers.retrieve(subscription.customer as string);
        if (customer && !customer.deleted) {
          const userId = customer.metadata.userId;
          if (userId) {
            await this.prisma.user.update({ where: { id: userId }, data: { plan: "free" } });
          }
        }
        break;
      }
    }
  }

  private priceIdToPlan(priceId: string): PlanName | null {
    const starterPriceId = this.config.get<string>("STRIPE_STARTER_PRICE_ID");
    const growthPriceId = this.config.get<string>("STRIPE_GROWTH_PRICE_ID");
    if (priceId === starterPriceId) return "starter";
    if (priceId === growthPriceId) return "growth";
    return null;
  }
}
