import { OAuth2Client } from 'google-auth-library';

import type { GoogleProfile, GoogleTokenVerifier } from '../../domain/repositories.js';
import { unauthorized } from '../../errors/app-error.js';

export class GoogleIdentityTokenVerifier implements GoogleTokenVerifier {
  constructor(
    private readonly clientId: string,
    private readonly client: Pick<OAuth2Client, 'verifyIdToken'> = new OAuth2Client()
  ) {}

  async verify(idToken: string): Promise<GoogleProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw unauthorized('Token do Google inválido');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name?.trim() || payload.email.split('@')[0] || 'Usuário',
        ...(payload.picture ? { avatarUrl: payload.picture } : {})
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw unauthorized('Token do Google inválido ou expirado');
    }
  }
}
