import { z } from 'zod';

import type { JsonObject } from '../domain/models.js';
import { badRequest } from '../errors/app-error.js';

const workspaceSchema = z.custom<JsonObject>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype,
  { message: 'workspace deve ser um objeto JSON' }
);

const nameSchema = z
  .string({ error: 'name deve ser uma string' })
  .trim()
  .min(1, 'name não pode ser vazio')
  .max(100, 'name deve ter no máximo 100 caracteres');

export const googleLoginSchema = z
  .object({
    idToken: z.string({ error: 'idToken é obrigatório' }).trim().min(1, 'idToken é obrigatório')
  })
  .strict();

export const createProjectSchema = z
  .object({
    name: nameSchema,
    workspace: workspaceSchema
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: nameSchema.optional(),
    workspace: workspaceSchema.optional()
  })
  .strict()
  .refine((value) => value.name !== undefined || value.workspace !== undefined, {
    message: 'Informe name ou workspace para atualizar'
  });

export type CreateProjectBody = {
  name: string;
  workspace: JsonObject;
};

export type UpdateProjectBody = {
  name?: string;
  workspace?: JsonObject;
};

export function parseBody<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    if (issue?.code === 'unrecognized_keys') {
      throw badRequest(`Campos não permitidos: ${issue.keys.join(', ')}`);
    }
    throw badRequest(issue?.message ?? 'Corpo da requisição inválido');
  }
  return result.data;
}
