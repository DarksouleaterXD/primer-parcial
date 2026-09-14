import {
  accountSchema,
  loginSchema,
  registerSchema,
  sessionSchema,
} from "@primer-parcial/contracts";
import { createZodDto } from "nestjs-zod";

export class RegisterDto extends createZodDto(registerSchema) {}

export class LoginDto extends createZodDto(loginSchema) {}

export class AccountDto extends createZodDto(accountSchema) {}

export class SessionDto extends createZodDto(sessionSchema) {}
