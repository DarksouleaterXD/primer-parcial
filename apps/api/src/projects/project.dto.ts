import {
  createProjectSchema,
  deleteProjectSchema,
  projectListSchema,
  projectSnapshotSchema,
  renameProjectSchema,
  saveProjectDocumentSchema,
} from "@primer-parcial/contracts";
import { createZodDto } from "nestjs-zod";

export class CreateProjectDto extends createZodDto(createProjectSchema) {}
export class RenameProjectDto extends createZodDto(renameProjectSchema) {}
export class SaveProjectDocumentDto extends createZodDto(saveProjectDocumentSchema) {}
export class DeleteProjectDto extends createZodDto(deleteProjectSchema) {}
export class ProjectSnapshotDto extends createZodDto(projectSnapshotSchema) {}
export class ProjectListDto extends createZodDto(projectListSchema) {}
