import { Inject, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

import {
  API_CONFIGURATION,
  type ApiConfiguration,
} from "../config/api-configuration.js";
import type { HealthResponse } from "@primer-parcial/contracts";

@Injectable()
export class HealthService {
  constructor(
    @Inject(API_CONFIGURATION) private readonly configuration: ApiConfiguration,
  ) {}

  async check(): Promise<HealthResponse> {
    const dataSource = new DataSource(this.configuration.database);

    try {
      await dataSource.initialize();
      await dataSource.query("SELECT 1");
      return { status: "available" };
    } catch {
      return { status: "unavailable" };
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }
}
