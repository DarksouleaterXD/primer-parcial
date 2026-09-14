import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";
import type { Request } from "express";

import { AuthService } from "./auth.service.js";
import { AccountDto, LoginDto, RegisterDto, SessionDto } from "./auth.dto.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import type { AuthenticatedPrincipal } from "./jwt.strategy.js";

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags("auth")
@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ZodResponse({
    status: 201,
    description: "Account created.",
    type: AccountDto,
  })
  register(@Body() registration: RegisterDto): Promise<AccountDto> {
    return this.authService.register(registration);
  }

  @Post("login")
  @HttpCode(200)
  @ZodResponse({
    status: 200,
    description: "JWT session created.",
    type: SessionDto,
  })
  login(@Body() credentials: LoginDto): Promise<SessionDto> {
    return this.authService.login(credentials);
  }

  @Get("session")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ZodResponse({
    status: 200,
    description: "Current authenticated account.",
    type: AccountDto,
  })
  currentSession(@Req() request: AuthenticatedRequest): Promise<AccountDto> {
    return this.authService.currentAccount(request.user.id);
  }
}
