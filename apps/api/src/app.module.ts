import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { ProjectsModule } from "./projects/projects.module";
import { RoomsModule } from "./rooms/rooms.module";
import { UsageModule } from "./usage/usage.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    // TypeORM + PostgreSQL added in Sprint 3 — Phase 1 uses in-memory stores
    AuthModule,
    ProjectsModule,
    RoomsModule,
    UsageModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
