// src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { sendSuccess, sendError, sendServerError } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET ?? 'chicken-flow-default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '10');

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      sendError(res, 'Nombre, email y contraseña son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, 'El email ya está registrado', 'VALIDATION_ERROR', 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role ?? 'operator', status: 'activo' },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    sendSuccess(res, { user, token }, 'Usuario registrado correctamente', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 'Email y contraseña son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status === 'bloqueado') {
      sendError(res, 'Credenciales inválidas o cuenta bloqueada', 'AUTH_INVALID', 401);
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      sendError(res, 'Credenciales inválidas', 'AUTH_INVALID', 401);
      return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const { passwordHash: _, ...userSafe } = user;
    // Normalizar: develop y superadmin tienen allowedRoutes null (acceso total)
    const responseUser = {
      ...userSafe,
      allowedRoutes: (user.role === 'develop' || (user.role as string) === 'superadmin')
        ? null
        : (user.allowedRoutes as string[] | null) ?? null,
    };
    sendSuccess(res, { user: responseUser, token }, 'Inicio de sesión exitoso');
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // JWT es stateless — el cliente descarta el token. Confirmamos con 200.
  sendSuccess(res, null, 'Sesión cerrada correctamente');
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, status: true, lastLogin: true, createdAt: true, allowedRoutes: true },
    });
    if (!user) { sendError(res, 'Usuario no encontrado', 'NOT_FOUND', 404); return; }
    const responseUser = {
      ...user,
      allowedRoutes: (user.role === 'develop' || (user.role as string) === 'superadmin')
        ? null
        : (user.allowedRoutes as string[] | null) ?? null,
    };
    sendSuccess(res, responseUser);
  } catch (err) {
    sendServerError(res, err);
  }
}

// GET /api/v1/auth/verify — valida el token JWT actual
export async function verifyToken(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    if (!user || user.status === 'bloqueado') {
      sendError(res, 'Token inválido o cuenta bloqueada', 'AUTH_INVALID', 401);
      return;
    }
    sendSuccess(res, { valid: true, user });
  } catch (err) {
    sendServerError(res, err);
  }
}

// POST /api/v1/auth/change-password — cambia contraseña del usuario autenticado
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      sendError(res, 'Contraseña actual y nueva son requeridas', 'VALIDATION_ERROR', 400);
      return;
    }
    if (newPassword.length < 6) {
      sendError(res, 'La nueva contraseña debe tener al menos 6 caracteres', 'VALIDATION_ERROR', 400);
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { sendError(res, 'Usuario no encontrado', 'NOT_FOUND', 404); return; }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      sendError(res, 'La contraseña actual es incorrecta', 'AUTH_INVALID', 401);
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    sendSuccess(res, { passwordChanged: true }, 'Contraseña actualizada correctamente');
  } catch (err) {
    sendServerError(res, err);
  }
}

// POST /api/v1/auth/forgot-password — genera token de recuperación
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { identifier } = req.body as { identifier: string };
    if (!identifier) {
      sendError(res, 'Email requerido', 'VALIDATION_ERROR', 400);
      return;
    }

    const email = identifier.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Siempre responder 200 para no revelar si el email existe
    if (!user) {
      sendSuccess(res, null, 'Si el email existe, recibirás instrucciones para restablecer tu contraseña');
      return;
    }

    // Token de 1 hora
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires: resetExpires },
    });

    // En producción se enviaría por email; aquí lo devolvemos en dev
    const isDev = process.env.NODE_ENV !== 'production';
    sendSuccess(
      res,
      isDev ? { resetToken } : null,
      'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
    );
  } catch (err) {
    sendServerError(res, err);
  }
}

// POST /api/v1/auth/reset-password — aplica nueva contraseña con token
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    if (!token || !newPassword) {
      sendError(res, 'Token y nueva contraseña son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }
    if (newPassword.length < 6) {
      sendError(res, 'La contraseña debe tener al menos 6 caracteres', 'VALIDATION_ERROR', 400);
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });
    if (!user) {
      sendError(res, 'Token inválido o expirado', 'AUTH_INVALID', 400);
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpires: null },
    });

    sendSuccess(res, null, 'Contraseña restablecida correctamente');
  } catch (err) {
    sendServerError(res, err);
  }
}
