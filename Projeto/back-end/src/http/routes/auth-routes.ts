import { Router } from 'express';

import type { SessionProvider } from '../../domain/repositories.js';
import type { AuthService } from '../../services/auth-service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { authenticate } from '../middleware/authenticate.js';
import { googleLoginSchema, parseBody } from '../validation.js';

export function createAuthRouter(
  authService: AuthService,
  sessions: SessionProvider
): Router {
  const router = Router();
  const requireAuth = authenticate(sessions);

  router.post(
    '/auth/google',
    asyncHandler(async (request, response) => {
      const { idToken } = parseBody(googleLoginSchema, request.body);
      response.status(200).json(await authService.loginWithGoogle(idToken));
    })
  );

  router.get(
    '/me',
    requireAuth,
    asyncHandler(async (request, response) => {
      response.status(200).json(await authService.getCurrentUser(request.userId!));
    })
  );

  router.post('/auth/logout', requireAuth, (_request, response) => {
    response.status(204).send();
  });

  return router;
}
