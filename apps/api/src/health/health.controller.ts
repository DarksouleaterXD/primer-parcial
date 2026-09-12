import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger";

import type { HealthResponse } from "@primer-parcial/contracts";
import { HealthService } from "./health.service.js";

const healthResponseSchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: ["available", "unavailable"],
    },
  },
};

@ApiTags("health")
@Controller("api/health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    description: "PostgreSQL is available.",
    schema: healthResponseSchema,
  })
  @ApiServiceUnavailableResponse({
    description: "PostgreSQL is unavailable.",
    schema: healthResponseSchema,
  })
  async check(): Promise<HealthResponse> {
    const response = await this.healthService.check();

    if (response.status === "unavailable") {
      throw new ServiceUnavailableException(response);
    }

    return response;
  }
}
