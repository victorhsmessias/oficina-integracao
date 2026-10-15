import { Router } from 'express';

import type { SessionProvider } from '../../domain/repositories.js';
import { notFound } from '../../errors/app-error.js';
import type { ProjectService } from '../../services/project-service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  createProjectSchema,
  parseBody,
  updateProjectSchema,
  type CreateProjectBody,
  type UpdateProjectBody
} from '../validation.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createProjectRouter(
  projectService: ProjectService,
  sessions: SessionProvider
): Router {
  const router = Router();
  router.use('/projects', authenticate(sessions));

  router.get(
    '/projects',
    asyncHandler(async (request, response) => {
      response.status(200).json(await projectService.list(request.userId!));
    })
  );

  router.post(
    '/projects',
    asyncHandler(async (request, response) => {
      const body = parseBody<CreateProjectBody>(createProjectSchema, request.body);
      response
        .status(201)
        .json(await projectService.create(request.userId!, body.name, body.workspace));
    })
  );

  router.get(
    '/projects/:id',
    asyncHandler(async (request, response) => {
      const id = projectId(request.params.id);
      response.status(200).json(await projectService.get(request.userId!, id));
    })
  );

  router.put(
    '/projects/:id',
    asyncHandler(async (request, response) => {
      const id = projectId(request.params.id);
      const body = parseBody<UpdateProjectBody>(updateProjectSchema, request.body);
      response.status(200).json(await projectService.update(request.userId!, id, body));
    })
  );

  router.delete(
    '/projects/:id',
    asyncHandler(async (request, response) => {
      const id = projectId(request.params.id);
      await projectService.delete(request.userId!, id);
      response.status(204).send();
    })
  );

  return router;
}

function projectId(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    throw notFound('Projeto não encontrado');
  }
  return value;
}
