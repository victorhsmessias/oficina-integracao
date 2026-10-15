export type JsonObject = Record<string, unknown>;

export interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  workspace: JsonObject;
  schemaVersion: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: Date;
}
