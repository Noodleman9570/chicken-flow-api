// src/controllers/users.controller.ts
// Módulo 12: Usuarios y Permisos

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../utils/response';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '10');

// Helper: normaliza req.params.id a string (Express 5 / Prisma v7 requieren string estricto)
const pid = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const { status, role } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, status: true, lastLogin: true, createdAt: true,
        assignedFarms: { include: { farm: { select: { id: true, name: true } } } },
      },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, users);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function inviteUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, role = 'operator', farmId } = req.body as Record<string, string>;

    if (!name || !email) {
      sendError(res, 'Nombre y email son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { sendError(res, 'El email ya está registrado', 'VALIDATION_ERROR', 409); return; }

    const tempPassword = `cf-${Math.random().toString(36).substring(2, 8)}`;
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role as 'admin' | 'operator' | 'client' | 'develop',
        status: 'pendiente',
        ...(farmId && { assignedFarms: { create: { farmId } } }),
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    sendSuccess(res, { user, tempPassword }, 'Usuario invitado. Debe cambiar su contraseña.', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = pid(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) { sendNotFound(res, 'Usuario'); return; }

    const { name, role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    sendSuccess(res, user, 'Usuario actualizado');
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = pid(req.params.id);
    const { status } = req.body as { status: string };
    const validStatuses = ['activo', 'pendiente', 'bloqueado'];
    if (!validStatuses.includes(status)) {
      sendError(res, `Estado inválido. Use: ${validStatuses.join(', ')}`, 'VALIDATION_ERROR', 400);
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status: status as 'activo' | 'pendiente' | 'bloqueado' },
      select: { id: true, name: true, email: true, status: true },
    });
    sendSuccess(res, user, 'Estado de usuario actualizado');
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function listPermissions(_req: Request, res: Response): Promise<void> {
  const permissions = [
    { key: 'lots:read', label: 'Ver lotes', module: 'produccion' },
    { key: 'lots:write', label: 'Crear y editar lotes', module: 'produccion' },
    { key: 'records:write', label: 'Registrar producción diaria', module: 'produccion' },
    { key: 'inventory:read', label: 'Ver inventario', module: 'inventario' },
    { key: 'inventory:write', label: 'Gestionar inventario', module: 'inventario' },
    { key: 'clients:read', label: 'Ver clientes', module: 'comercial' },
    { key: 'clients:write', label: 'Crear y editar clientes', module: 'comercial' },
    { key: 'invoices:read', label: 'Ver facturas', module: 'comercial' },
    { key: 'invoices:write', label: 'Crear facturas', module: 'comercial' },
    { key: 'payments:write', label: 'Registrar pagos', module: 'comercial' },
    { key: 'finance:read', label: 'Ver finanzas', module: 'financiero' },
    { key: 'finance:close', label: 'Cerrar periodos financieros', module: 'financiero' },
    { key: 'reports:read', label: 'Ver reportes', module: 'reportes' },
    { key: 'reports:generate', label: 'Generar reportes', module: 'reportes' },
    { key: 'users:manage', label: 'Gestionar usuarios', module: 'admin' },
    { key: 'farms:manage', label: 'Gestionar granjas', module: 'admin' },
  ];
  sendSuccess(res, permissions);
}
