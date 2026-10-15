import type { ErrorRequestHandler, RequestHandler } from 'express';

import { AppError } from '../../errors/app-error.js';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ message: 'Rota não encontrada' });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (isPayloadTooLarge(error)) {
    response.status(413).json({ message: 'Corpo da requisição excede o limite de 256 KB' });
    return;
  }

  if (isMalformedJson(error)) {
    response.status(400).json({ message: 'JSON inválido' });
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }
  response.status(500).json({ message: 'Erro interno do servidor' });
};

function isPayloadTooLarge(error: unknown): error is { type: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  );
}

function isMalformedJson(error: unknown): error is SyntaxError & { status: number } {
  return error instanceof SyntaxError && 'status' in error && error.status === 400;
}
