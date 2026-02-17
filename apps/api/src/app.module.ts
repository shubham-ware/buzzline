import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { PrismaService } from "./prisma.service";
import { AuthModule } from "./auth/auth.module";
import { ProjectsModule } from "./projects/projects.module";
import { RoomsModule } from "./rooms/rooms.module";
import { UsageModule } from "./usage/usage.module";
import { BillingModule } from "./billing/billing.module";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    AuthModule,
    ProjectsModule,
    RoomsModule,
    UsageModule,
    BillingModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
