import jwt, { type SignOptions } from 'jsonwebtoken';

import type { SessionProvider, SessionVerification } from '../../domain/repositories.js';

export class JwtSessionProvider implements SessionProvider {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string
  ) {}

  sign(userId: string): string {
    return jwt.sign({}, this.secret, {
      subject: userId,
      expiresIn: this.expiresIn as SignOptions['expiresIn'],
      algorithm: 'HS256'
    });
  }

  verify(token: string): SessionVerification {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || !payload.sub) {
        return { valid: false, reason: 'invalid' };
      }
      return { valid: true, userId: payload.sub };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, reason: 'expired' };
      }
      return { valid: false, reason: 'invalid' };
    }
  }
}
