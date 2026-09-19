import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";

export function projectNotFound(): NotFoundException {
  return new NotFoundException({ code: "PROJECT_NOT_FOUND" });
}

export function projectRevisionConflict(): ConflictException {
  return new ConflictException({ code: "PROJECT_REVISION_CONFLICT" });
}

export function projectDocumentInvalid(): BadRequestException {
  return new BadRequestException({ code: "PROJECT_DOCUMENT_INVALID" });
}

export function projectStorageUnavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException({ code: "PROJECT_STORAGE_UNAVAILABLE" });
}
