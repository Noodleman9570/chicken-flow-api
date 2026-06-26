// src/middleware/auth.middleware.ts
// Middleware de autenticación JWT

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'chicken-flow-default-secret';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendUnauthorized(res, 'Token de autenticación no proporcionado');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    sendUnauthorized(res, 'Token inválido o expirado');
  }
}

/**
 * Factory para restringir acceso por roles
 * @example requireRole('admin', 'operator')
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'No tienes permisos suficientes para esta acción');
      return;
    }
    next();
  };
}
