import {
  accountSchema,
  credentialsSchema,
  sessionSchema,
} from "@primer-parcial/contracts";
import { createZodDto } from "nestjs-zod";

export class CredentialsDto extends createZodDto(credentialsSchema) {}

export class AccountDto extends createZodDto(accountSchema) {}

export class SessionDto extends createZodDto(sessionSchema) {}
