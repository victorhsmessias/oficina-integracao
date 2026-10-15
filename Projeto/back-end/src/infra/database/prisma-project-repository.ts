import type { JsonObject, Project, ProjectSummary } from '../../domain/models.js';
import type {
  CreateProjectInput,
  ProjectRepository,
  UpdateProjectInput
} from '../../domain/repositories.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { AppPrismaClient } from './prisma.js';

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async listByUser(userId: string): Promise<ProjectSummary[]> {
    return this.prisma.project.findMany({
      where: { userId },
      select: { id: true, name: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async create(userId: string, input: CreateProjectInput): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        userId,
        name: input.name,
        workspace: input.workspace as Prisma.InputJsonObject,
        schemaVersion: input.schemaVersion
      }
    });
    return asDomainProject(project);
  }

  async findOwnedById(userId: string, id: string): Promise<Project | null> {
    const project = await this.prisma.project.findFirst({ where: { id, userId } });
    return project ? asDomainProject(project) : null;
  }

  async updateOwnedById(
    userId: string,
    id: string,
    input: UpdateProjectInput
  ): Promise<Project | null> {
    const result = await this.prisma.project.updateMany({
      where: { id, userId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.workspace !== undefined
          ? { workspace: input.workspace as Prisma.InputJsonObject }
          : {})
      }
    });

    if (result.count === 0) {
      return null;
    }

    const project = await this.prisma.project.findFirst({ where: { id, userId } });
    return project ? asDomainProject(project) : null;
  }

  async deleteOwnedById(userId: string, id: string): Promise<boolean> {
    const result = await this.prisma.project.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }
}

function asDomainProject(project: {
  id: string;
  name: string;
  workspace: Prisma.JsonValue;
  schemaVersion: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}): Project {
  return {
    ...project,
    workspace: project.workspace as JsonObject
  };
}
