import { Module } from "@nestjs/common";
import { RoomsController } from "./rooms.controller";
import { RoomsService } from "./rooms.service";
import { RoomsGateway } from "./rooms.gateway";
import { ProjectsModule } from "../projects/projects.module";
import { UsageModule } from "../usage/usage.module";

@Module({
  imports: [ProjectsModule, UsageModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
  exports: [RoomsService],
})
export class RoomsModule {}
