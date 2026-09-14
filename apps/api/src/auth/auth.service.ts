import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type {
  Account,
  LoginCredentials,
  RegisterCredentials,
  Session,
} from "@primer-parcial/contracts";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { QueryFailedError, type Repository } from "typeorm";

import {
  AuthDataSource,
  DatabaseUnavailableError,
} from "../database/auth-data-source.js";
import {
  API_CONFIGURATION,
  type ApiConfiguration,
} from "../config/api-configuration.js";
import { User } from "../users/user.entity.js";
import {
  authenticationFailed,
  authenticationUnavailable,
  registrationFailed,
} from "./auth-errors.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly authDataSource: AuthDataSource,
    private readonly jwtService: JwtService,
    @Inject(API_CONFIGURATION) private readonly configuration: ApiConfiguration,
  ) {}

  async register(registration: RegisterCredentials): Promise<Account> {
    try {
      const repository = await this.repository();
      const passwordHash = await bcrypt.hash(
        registration.password,
        this.configuration.authentication.bcryptCost,
      );
      const user = repository.create({
        id: randomUUID(),
        firstName: registration.firstName,
        lastName: registration.lastName,
        email: registration.email,
        passwordHash,
      });

      return toAccount(await repository.save(user));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw registrationFailed();
      }

      if (error instanceof DatabaseUnavailableError || error instanceof QueryFailedError) {
        throw authenticationUnavailable();
      }

      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<Session> {
    try {
      const repository = await this.repository();
      const user = await repository
        .createQueryBuilder("user")
        .addSelect("user.passwordHash")
        .where("user.email = :email", { email: credentials.email })
        .getOne();

      if (!user || !(await bcrypt.compare(credentials.password, user.passwordHash))) {
        throw authenticationFailed();
      }

      return {
        accessToken: await this.jwtService.signAsync({ sub: user.id }),
      };
    } catch (error) {
      if (error instanceof DatabaseUnavailableError || error instanceof QueryFailedError) {
        throw authenticationUnavailable();
      }

      throw error;
    }
  }

  async currentAccount(id: string): Promise<Account> {
    try {
      const user = await (await this.repository()).findOneBy({ id });

      if (!user) {
        throw authenticationFailed();
      }

      return toAccount(user);
    } catch (error) {
      if (error instanceof DatabaseUnavailableError || error instanceof QueryFailedError) {
        throw authenticationUnavailable();
      }

      throw error;
    }
  }

  private async repository(): Promise<Repository<User>> {
    return (await this.authDataSource.get()).getRepository(User);
  }
}

function toAccount(user: User): Account {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
