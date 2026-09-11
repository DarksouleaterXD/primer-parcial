export type HealthStatus = "available" | "unavailable";

export interface HealthResponse {
  status: HealthStatus;
}
