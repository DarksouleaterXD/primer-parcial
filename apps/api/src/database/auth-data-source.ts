import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { DataSource } from "typeorm";

import {
  API_CONFIGURATION,
  type ApiConfiguration,
} from "../config/api-configuration.js";
import { User } from "../users/user.entity.js";

export class DatabaseUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Authentication database is unavailable", { cause });
  }
}

@Injectable()
export class AuthDataSource implements OnModuleDestroy {
  private dataSource: DataSource | undefined;
  private initialization: Promise<DataSource> | undefined;

  constructor(
    @Inject(API_CONFIGURATION) private readonly configuration: ApiConfiguration,
  ) {}

  async get(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    if (!this.initialization) {
      this.initialization = this.initialize();
    }

    return this.initialization;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  private async initialize(): Promise<DataSource> {
    const dataSource = new DataSource({
      ...this.configuration.database,
      entities: [User],
      migrations: [],
      synchronize: false,
    });

    try {
      await dataSource.initialize();
      this.dataSource = dataSource;
      return dataSource;
    } catch (error) {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }

      throw new DatabaseUnavailableError(error);
    } finally {
      this.initialization = undefined;
    }
  }
}
