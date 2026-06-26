// src/utils/response.ts
// Helpers para construir respuestas estandarizadas

import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operación exitosa',
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): Response {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function sendError(
  res: Response,
  message: string,
  errorCode: string,
  statusCode = 400,
  details?: Record<string, string[]>
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorCode,
    ...(details && { details }),
  });
}

export function sendNotFound(res: Response, resource = 'Recurso'): Response {
  return sendError(res, `${resource} no encontrado`, 'NOT_FOUND', 404);
}

export function sendUnauthorized(res: Response, message = 'No autorizado'): Response {
  return sendError(res, message, 'AUTH_REQUIRED', 401);
}

export function sendForbidden(res: Response, message = 'Acceso denegado'): Response {
  return sendError(res, message, 'FORBIDDEN', 403);
}

export function sendServerError(res: Response, error?: unknown): Response {
  console.error('[SERVER ERROR]', error);
  return sendError(res, 'Error interno del servidor', 'INTERNAL_ERROR', 500);
}

// Utilidad para paginación de queries
export function getPaginationParams(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(String(query.page ?? '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '10'))));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
