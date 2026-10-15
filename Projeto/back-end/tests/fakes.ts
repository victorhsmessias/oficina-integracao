import type { JsonObject, Project, ProjectSummary, User } from '../src/domain/models.js';
import type {
  CreateProjectInput,
  DatabaseHealthChecker,
  GoogleProfile,
  GoogleTokenVerifier,
  ProjectRepository,
  SessionProvider,
  SessionVerification,
  UpdateProjectInput,
  UserRepository
} from '../src/domain/repositories.js';

export class FakeDatabaseHealthChecker implements DatabaseHealthChecker {
  error: Error | null = null;

  async check(): Promise<void> {
    if (this.error) throw this.error;
  }
}

export const userFixture: User = {
  id: '11111111-1111-4111-8111-111111111111',
  googleId: 'google-123',
  name: 'Ana Souza',
  email: 'ana@gmail.com',
  avatarUrl: 'https://example.com/ana.png',
  createdAt: new Date('2026-10-14T20:00:00.000Z'),
  updatedAt: new Date('2026-10-14T20:00:00.000Z')
};

export class FakeUserRepository implements UserRepository {
  user: User | null = userFixture;

  async upsertGoogleUser(profile: GoogleProfile): Promise<User> {
    this.user = {
      ...userFixture,
      googleId: profile.googleId,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl ?? null
    };
    return this.user;
  }

  async findById(id: string): Promise<User | null> {
    return this.user?.id === id ? this.user : null;
  }
}

export class FakeGoogleVerifier implements GoogleTokenVerifier {
  async verify(idToken: string): Promise<GoogleProfile> {
    if (idToken === 'invalid-google-token') {
      throw new Error('token rejected');
    }
    return {
      googleId: 'google-123',
      name: 'Ana Souza',
      email: 'ana@gmail.com',
      avatarUrl: 'https://example.com/ana.png'
    };
  }
}

export class FakeSessionProvider implements SessionProvider {
  sign(userId: string): string {
    return `session:${userId}`;
  }

  verify(token: string): SessionVerification {
    if (token === 'expired') return { valid: false, reason: 'expired' };
    if (!token.startsWith('session:')) return { valid: false, reason: 'invalid' };
    return { valid: true, userId: token.slice('session:'.length) };
  }
}

export class FakeProjectRepository implements ProjectRepository {
  projects: Project[] = [];

  async listByUser(userId: string): Promise<ProjectSummary[]> {
    return this.projects
      .filter((project) => project.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
  }

  async create(userId: string, input: CreateProjectInput): Promise<Project> {
    const project: Project = {
      id: '22222222-2222-4222-8222-222222222222',
      userId,
      name: input.name,
      workspace: input.workspace,
      schemaVersion: input.schemaVersion,
      createdAt: new Date('2026-10-14T20:00:00.000Z'),
      updatedAt: new Date('2026-10-14T20:00:00.000Z')
    };
    this.projects.push(project);
    return project;
  }

  async findOwnedById(userId: string, id: string): Promise<Project | null> {
    return this.projects.find((project) => project.userId === userId && project.id === id) ?? null;
  }

  async updateOwnedById(
    userId: string,
    id: string,
    input: UpdateProjectInput
  ): Promise<Project | null> {
    const project = await this.findOwnedById(userId, id);
    if (!project) return null;
    if (input.name !== undefined) project.name = input.name;
    if (input.workspace !== undefined) project.workspace = input.workspace as JsonObject;
    project.updatedAt = new Date('2026-10-14T20:30:00.000Z');
    return project;
  }

  async deleteOwnedById(userId: string, id: string): Promise<boolean> {
    const index = this.projects.findIndex(
      (project) => project.userId === userId && project.id === id
    );
    if (index === -1) return false;
    this.projects.splice(index, 1);
    return true;
  }
}
