import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";
import type { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { AuthenticatedPrincipal } from "../auth/jwt.strategy.js";
import {
  CreateProjectDto,
  DeleteProjectDto,
  ProjectListDto,
  ProjectSnapshotDto,
  RenameProjectDto,
  SaveProjectDocumentDto,
} from "./project.dto.js";
import { UmlProjectService } from "./project.service.js";

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags("projects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/projects")
export class ProjectController {
  constructor(private readonly projectService: UmlProjectService) {}

  @Post()
  @ZodResponse({ status: 201, description: "Project created.", type: ProjectSnapshotDto })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateProjectDto,
  ): Promise<ProjectSnapshotDto> {
    return this.projectService.create(request.user.id, body);
  }

  @Get()
  @ZodResponse({ status: 200, description: "Private project summaries.", type: ProjectListDto })
  list(@Req() request: AuthenticatedRequest): Promise<ProjectListDto> {
    return this.projectService.list(request.user.id);
  }

  @Get(":projectId")
  @ApiResponse({ status: 404, description: "Project not found.", schema: { type: "object", additionalProperties: false, required: ["code"], properties: { code: { type: "string", enum: ["PROJECT_NOT_FOUND"] } } } })
  @ZodResponse({ status: 200, description: "Canonical project snapshot.", type: ProjectSnapshotDto })
  get(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ): Promise<ProjectSnapshotDto> {
    return this.projectService.get(request.user.id, projectId);
  }

  @Patch(":projectId/name")
  @ApiResponse({ status: 404, description: "Project not found.", schema: { type: "object", additionalProperties: false, required: ["code"], properties: { code: { type: "string", enum: ["PROJECT_NOT_FOUND"] } } } })
  @ApiResponse({ status: 409, description: "Stale project revision.", schema: { type: "object", additionalProperties: false, required: ["code"], properties: { code: { type: "string", enum: ["PROJECT_REVISION_CONFLICT"] } } } })
  @ZodResponse({ status: 200, description: "Renamed project snapshot.", type: ProjectSnapshotDto })
  rename(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() body: RenameProjectDto,
  ): Promise<ProjectSnapshotDto> {
    return this.projectService.rename(request.user.id, projectId, body);
  }

  @Put(":projectId/document")
  @ApiResponse({ status: 400, description: "Invalid project document.", schema: { type: "object", additionalProperties: false, required: ["code"], properties: { code: { type: "string", enum: ["PROJECT_DOCUMENT_INVALID"] } } } })
  @ApiResponse({ status: 404, description: "Project not found.", schema: { type: "object", additionalProperties: false, required: ["code"], properties: { code: { type: "string", enum: ["PROJECT_NOT_FOUND"] } } } })
  @ApiResponse({ status: 409, description: "Stale project revision.", schema: { type: "object", additionalProperties: false, required: ["code"], properties: { code: { type: "string", enum: ["PROJECT_REVISION_CONFLICT"] } } } })
  @ZodResponse({ status: 200, description: "Saved project snapshot.", type: ProjectSnapshotDto })
  save(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() body: SaveProjectDocumentDto,
  ): Promise<ProjectSnapshotDto> {
    return this.projectService.save(request.user.id, projectId, body);
  }

  @Delete(":projectId")
  @HttpCode(204)
  @ApiResponse({ status: 204, description: "Project deleted." })
  @ApiResponse({ status: 404, description: "Project not found.", schema: { type: "object", additionalProperties: false, required: ["code"], properties: { code: { type: "string", enum: ["PROJECT_NOT_FOUND"] } } } })
  @ApiResponse({ status: 409, description: "Stale project revision.", schema: { type: "object", additionalProperties: false, required: ["code"], properties: { code: { type: "string", enum: ["PROJECT_REVISION_CONFLICT"] } } } })
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() body: DeleteProjectDto,
  ): Promise<void> {
    await this.projectService.delete(request.user.id, projectId, body);
  }
}
