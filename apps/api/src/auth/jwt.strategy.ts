import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import {
  API_CONFIGURATION,
  type ApiConfiguration,
} from "../config/api-configuration.js";

export interface JwtPayload {
  readonly sub: string;
}

export interface AuthenticatedPrincipal {
  readonly id: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(API_CONFIGURATION) configuration: ApiConfiguration,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuration.authentication.jwtSecret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedPrincipal {
    return { id: payload.sub };
  }
}
