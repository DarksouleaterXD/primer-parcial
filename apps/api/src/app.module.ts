import { DynamicModule, Module } from "@nestjs/common";

import {
  API_CONFIGURATION,
  type ApiConfiguration,
} from "./config/api-configuration.js";
import { HealthController } from "./health/health.controller.js";
import { HealthService } from "./health/health.service.js";

@Module({})
export class AppModule {
  static register(configuration: ApiConfiguration): DynamicModule {
    return {
      module: AppModule,
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: API_CONFIGURATION,
          useValue: configuration,
        },
      ],
    };
  }
}
