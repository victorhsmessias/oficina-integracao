import type { JsonObject, Project, ProjectSummary, User } from './models.js';

export interface GoogleProfile {
  googleId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface UserRepository {
  upsertGoogleUser(profile: GoogleProfile): Promise<User>;
  findById(id: string): Promise<User | null>;
}

export interface CreateProjectInput {
  name: string;
  workspace: JsonObject;
  schemaVersion: number;
}

export interface UpdateProjectInput {
  name?: string;
  workspace?: JsonObject;
}

export interface ProjectRepository {
  listByUser(userId: string): Promise<ProjectSummary[]>;
  create(userId: string, input: CreateProjectInput): Promise<Project>;
  findOwnedById(userId: string, id: string): Promise<Project | null>;
  updateOwnedById(userId: string, id: string, input: UpdateProjectInput): Promise<Project | null>;
  deleteOwnedById(userId: string, id: string): Promise<boolean>;
}

export interface GoogleTokenVerifier {
  verify(idToken: string): Promise<GoogleProfile>;
}

export type SessionVerification =
  | { valid: true; userId: string }
  | { valid: false; reason: 'expired' | 'invalid' };

export interface SessionProvider {
  sign(userId: string): string;
  verify(token: string): SessionVerification;
}

export interface DatabaseHealthChecker {
  check(): Promise<void>;
}
