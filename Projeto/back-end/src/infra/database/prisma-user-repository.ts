import type { GoogleProfile, UserRepository } from '../../domain/repositories.js';
import type { User } from '../../domain/models.js';
import type { AppPrismaClient } from './prisma.js';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async upsertGoogleUser(profile: GoogleProfile): Promise<User> {
    return this.prisma.user.upsert({
      where: { googleId: profile.googleId },
      create: {
        googleId: profile.googleId,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl
      },
      update: {
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl
      }
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
