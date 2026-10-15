import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import type { DatabaseHealthChecker, SessionProvider } from './domain/repositories.js';
import { AppError } from './errors/app-error.js';
import { errorHandler, notFoundHandler } from './http/middleware/error-handler.js';
import { asyncHandler } from './http/middleware/async-handler.js';
import { createAuthRouter } from './http/routes/auth-routes.js';
import { createProjectRouter } from './http/routes/project-routes.js';
import type { AuthService } from './services/auth-service.js';
import type { ProjectService } from './services/project-service.js';

export interface AppDependencies {
  authService: AuthService;
  projectService: ProjectService;
  sessions: SessionProvider;
  databaseHealth: DatabaseHealthChecker;
  corsOrigins: string[];
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || dependencies.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new AppError(403, 'Origem não permitida pelo CORS'));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.get(
    '/ready',
    asyncHandler(async (_request, response) => {
      await dependencies.databaseHealth.check();
      response.status(200).json({ status: 'ready', database: 'connected' });
    })
  );

  app.use(createAuthRouter(dependencies.authService, dependencies.sessions));
  app.use(createProjectRouter(dependencies.projectService, dependencies.sessions));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
