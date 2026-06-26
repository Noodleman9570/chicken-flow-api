// src/middleware/error.middleware.ts
// Manejador de errores global de Express

import { Request, Response, NextFunction } from 'express';
import { sendServerError } from '../utils/response';

export interface AppError extends Error {
  statusCode?: number;
  errorCode?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${req.method} ${req.path}`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode ?? 'APP_ERROR',
    });
    return;
  }

  sendServerError(res, err);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.path} no encontrada`,
    error: 'NOT_FOUND',
  });
}

export function createAppError(
  message: string,
  statusCode: number,
  errorCode: string
): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.errorCode = errorCode;
  return err;
}
