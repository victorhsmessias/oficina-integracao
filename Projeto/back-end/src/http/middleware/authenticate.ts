import type { RequestHandler } from 'express';

import type { SessionProvider } from '../../domain/repositories.js';
import { unauthorized } from '../../errors/app-error.js';

export function authenticate(sessions: SessionProvider): RequestHandler {
  return (request, _response, next) => {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      next(unauthorized('Token de autenticação não informado'));
      return;
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      next(unauthorized('Token de autenticação não informado'));
      return;
    }

    const result = sessions.verify(token);
    if (!result.valid) {
      next(
        unauthorized(result.reason === 'expired' ? 'Sessão expirada' : 'Sessão inválida')
      );
      return;
    }

    request.userId = result.userId;
    next();
  };
}
