import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client: InstanceType<typeof PrismaClient>;
  private pool: pg.Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/buzzline";
    this.pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(this.pool);
    this.client = new (PrismaClient as any)({ adapter });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    await this.pool.end();
  }

  get user() { return this.client.user; }
  get project() { return this.client.project; }
  get room() { return this.client.room; }
  get usageRecord() { return this.client.usageRecord; }
}
