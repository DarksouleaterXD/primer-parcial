import { useEffect, useState } from "preact/hooks";

import type { HealthResponse } from "@primer-parcial/contracts";

const DEFAULT_TIMEOUT_MS = 5_000;

type Availability = "checking" | "available" | "unavailable";

interface ApiStatusProps {
  readonly apiOrigin: string;
  readonly timeoutMs?: number;
}

export function ApiStatus({
  apiOrigin,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: ApiStatusProps) {
  const [availability, setAvailability] = useState<Availability>("checking");

  useEffect(() => {
    if (!apiOrigin) {
      setAvailability("unavailable");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    async function checkHealth(): Promise<void> {
      try {
        const response = await fetch(
          `${apiOrigin.replace(/\/$/, "")}/api/health`,
          { signal: controller.signal },
        );

        if (response.status !== 200) {
          setAvailability("unavailable");
          return;
        }

        const payload: unknown = await response.json();
        setAvailability(isAvailableHealthResponse(payload) ? "available" : "unavailable");
      } catch {
        setAvailability("unavailable");
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void checkHealth();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [apiOrigin, timeoutMs]);

  return <p aria-live="polite">{availabilityLabel(availability)}</p>;
}

function isAvailableHealthResponse(payload: unknown): payload is HealthResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "status" in payload &&
    payload.status === "available"
  );
}

function availabilityLabel(availability: Availability): string {
  switch (availability) {
    case "available":
      return "API disponible";
    case "unavailable":
      return "API no disponible";
    case "checking":
      return "comprobando";
  }
}
