import type { JsonObject, Project, ProjectSummary } from '../domain/models.js';
import type { ProjectRepository, UpdateProjectInput } from '../domain/repositories.js';
import { notFound } from '../errors/app-error.js';

export interface ProjectResponse {
  id: string;
  name: string;
  workspace: JsonObject;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummaryResponse {
  id: string;
  name: string;
  updatedAt: string;
}

export class ProjectService {
  constructor(private readonly projects: ProjectRepository) {}

  async list(userId: string): Promise<ProjectSummaryResponse[]> {
    return (await this.projects.listByUser(userId)).map(toSummaryResponse);
  }

  async create(userId: string, name: string, workspace: JsonObject): Promise<ProjectResponse> {
    const project = await this.projects.create(userId, {
      name,
      workspace,
      schemaVersion: 1
    });
    return toProjectResponse(project);
  }

  async get(userId: string, id: string): Promise<ProjectResponse> {
    const project = await this.projects.findOwnedById(userId, id);
    if (!project) {
      throw notFound('Projeto não encontrado');
    }
    return toProjectResponse(project);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateProjectInput
  ): Promise<ProjectResponse> {
    const project = await this.projects.updateOwnedById(userId, id, input);
    if (!project) {
      throw notFound('Projeto não encontrado');
    }
    return toProjectResponse(project);
  }

  async delete(userId: string, id: string): Promise<void> {
    const deleted = await this.projects.deleteOwnedById(userId, id);
    if (!deleted) {
      throw notFound('Projeto não encontrado');
    }
  }
}

function toProjectResponse(project: Project): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    workspace: project.workspace,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

function toSummaryResponse(project: ProjectSummary): ProjectSummaryResponse {
  return {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt.toISOString()
  };
}
