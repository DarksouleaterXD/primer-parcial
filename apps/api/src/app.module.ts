import { DynamicModule, Module } from "@nestjs/common";

import {
  API_CONFIGURATION,
  type ApiConfiguration,
} from "./config/api-configuration.js";
import { AuthModule } from "./auth/auth.module.js";
import { HealthController } from "./health/health.controller.js";
import { HealthService } from "./health/health.service.js";
import { ProjectController } from "./projects/project.controller.js";
import { UmlProjectService } from "./projects/project.service.js";

@Module({})
export class AppModule {
  static register(configuration: ApiConfiguration): DynamicModule {
    return {
      module: AppModule,
      imports: [AuthModule.register(configuration)],
      controllers: [HealthController, ProjectController],
      providers: [
        HealthService,
        UmlProjectService,
        {
          provide: API_CONFIGURATION,
          useValue: configuration,
        },
      ],
    };
  }
}
