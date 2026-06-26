// src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    sendSuccess(res, { user: userSafe, token }, 'Inicio de sesión exitoso');
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, status: true, lastLogin: true, createdAt: true },
    });
    if (!user) { sendError(res, 'Usuario no encontrado', 'NOT_FOUND', 404); return; }
    sendSuccess(res, user);
  } catch (err) {
    sendServerError(res, err);
  }
}
