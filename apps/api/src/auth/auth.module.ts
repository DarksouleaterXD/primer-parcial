import { DynamicModule, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import {
  API_CONFIGURATION,
  type ApiConfiguration,
} from "../config/api-configuration.js";
import { AuthDataSource } from "../database/auth-data-source.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { JwtStrategy } from "./jwt.strategy.js";

@Module({})
export class AuthModule {
  static register(configuration: ApiConfiguration): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
          secret: configuration.authentication.jwtSecret,
          signOptions: {
            expiresIn: configuration.authentication.jwtExpiresInSeconds,
          },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthDataSource,
        AuthService,
        JwtAuthGuard,
        JwtStrategy,
        {
          provide: API_CONFIGURATION,
          useValue: configuration,
        },
      ],
    };
  }
}
