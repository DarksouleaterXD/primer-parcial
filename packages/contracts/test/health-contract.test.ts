import { expectTypeOf, it } from "vitest";

import type { HealthResponse, HealthStatus } from "../src/index.js";

it("defines the only health states", () => {
  expectTypeOf<HealthStatus>().toEqualTypeOf<"available" | "unavailable">();
  expectTypeOf<HealthResponse>().toEqualTypeOf<{
    status: HealthStatus;
  }>();
});
