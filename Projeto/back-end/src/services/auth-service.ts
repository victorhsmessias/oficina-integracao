import type { PublicUser, User } from '../domain/models.js';
import type {
  GoogleTokenVerifier,
  SessionProvider,
  UserRepository
} from '../domain/repositories.js';
import { unauthorized } from '../errors/app-error.js';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly googleVerifier: GoogleTokenVerifier,
    private readonly sessions: SessionProvider
  ) {}

  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const profile = await this.googleVerifier.verify(idToken);
    const user = await this.users.upsertGoogleUser(profile);

    return {
      token: this.sessions.sign(user.id),
      user: toPublicUser(user)
    };
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw unauthorized('Sessão inválida');
    }

    return toPublicUser(user);
  }
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {})
  };
}
