import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../prisma.service";

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret = this.config.get<string>("JWT_SECRET", "buzzline-dev-secret");
  }

  async signup(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    const token = this.signToken(user.id, user.email, user.plan);
    return { token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid email or password");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid email or password");

    const token = this.signToken(user.id, user.email, user.plan);
    return { token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } };
  }

  verifyToken(token: string): { userId: string; email: string; plan: string } {
    try {
      return jwt.verify(token, this.jwtSecret) as any;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private signToken(userId: string, email: string, plan: string): string {
    return jwt.sign({ userId, email, plan }, this.jwtSecret, { expiresIn: "7d" });
  }
}
