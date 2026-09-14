import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

export function registrationFailed(): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    error: "Bad Request",
    message: "Unable to register account",
  });
}

export function authenticationFailed(): UnauthorizedException {
  return new UnauthorizedException({
    statusCode: 401,
    error: "Unauthorized",
    message: "Authentication failed",
  });
}

export function authenticationUnavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    statusCode: 503,
    error: "Service Unavailable",
    message: "Authentication service unavailable",
  });
}
