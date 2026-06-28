// src/controllers/notifications.controller.ts
// Módulo 13: Notificaciones del sistema

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../utils/response';

// GET /api/v1/notifications
export async function listNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { sendError(res, 'No autenticado', 'AUTH_REQUIRED', 401); return; }

    const { read, module, limit = '50' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId };

    if (read !== undefined) where.read = read === 'true';
    if (module) where.module = module;

    // Excluir notificaciones expiradas
    where.OR = [{ expiresAt: null }, { expiresAt: { gte: new Date() } }];

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      take: Math.min(parseInt(limit), 100),
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
    });

    sendSuccess(res, { notifications, unreadCount });
  } catch (err) {
    sendServerError(res, err);
  }
}

// PUT /api/v1/notifications/:id/read
export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const id = String(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) { sendNotFound(res, 'Notificación'); return; }
    if (notification.read) { sendSuccess(res, notification, 'Ya estaba marcada como leída'); return; }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });

    sendSuccess(res, updated, 'Notificación marcada como leída');
  } catch (err) {
    sendServerError(res, err);
  }
}

// PUT /api/v1/notifications/read-all
export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { sendError(res, 'No autenticado', 'AUTH_REQUIRED', 401); return; }

    const { module } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId, read: false };
    if (module) where.module = module;

    const { count } = await prisma.notification.updateMany({
      where,
      data: { read: true, readAt: new Date() },
    });

    sendSuccess(res, { updated: count }, `${count} notificaciones marcadas como leídas`);
  } catch (err) {
    sendServerError(res, err);
  }
}

// POST /api/v1/notifications — Solo admin/develop puede crear notificaciones manuales
export async function createNotification(req: Request, res: Response): Promise<void> {
  try {
    const creatorRole = req.user?.role;
    if (!['admin', 'develop'].includes(creatorRole ?? '')) {
      sendError(res, 'Solo administradores pueden crear notificaciones manuales', 'FORBIDDEN', 403);
      return;
    }

    const { userId, module, type, priority, title, message, href, expiresAt, metadata } = req.body as Record<string, unknown>;

    if (!userId || !title || !message) {
      sendError(res, 'userId, title y message son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: String(userId) } });
    if (!targetUser) { sendNotFound(res, 'Usuario destinatario'); return; }

    const notification = await prisma.notification.create({
      data: {
        userId: String(userId),
        createdBy: req.user?.userId,
        module: (module as any) ?? 'general',
        type: (type as any) ?? 'manual',
        priority: (priority as any) ?? 'medium',
        title: String(title),
        message: String(message),
        href: href ? String(href) : '/dashboard',
        expiresAt: expiresAt ? new Date(String(expiresAt)) : undefined,
        metadata: metadata as any ?? undefined,
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    sendSuccess(res, notification, 'Notificación creada', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

// POST /api/v1/notifications/system — Genera notificaciones automáticas de cobros vencidos
// Llamar desde un cron job o manualmente por admin
export async function generateCollectionAlerts(req: Request, res: Response): Promise<void> {
  try {
    const creatorRole = req.user?.role;
    if (!['admin', 'develop'].includes(creatorRole ?? '')) {
      sendError(res, 'Solo administradores pueden ejecutar esto', 'FORBIDDEN', 403);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Facturas vencidas o próximas a vencer (en 2 días)
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const candidateInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['emitida', 'vencida'] },
        dueDate: { lte: twoDaysFromNow },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        lot: { select: { code: true, createdBy: true } },
      },
    });

    // Filtrar solo las que tienen saldo pendiente real
    const overdueInvoices = candidateInvoices.filter((i) => i.paidAmount < i.subtotal);

    let created = 0;
    for (const invoice of overdueInvoices) {
      if (!invoice.lot?.createdBy) continue;

      const pendingAmount = invoice.subtotal - invoice.paidAmount;
      const isOverdue = invoice.dueDate && invoice.dueDate < today;
      const daysOverdue = isOverdue && invoice.dueDate
        ? Math.floor((today.getTime() - invoice.dueDate.getTime()) / 86400000)
        : 0;

      // Evitar duplicar notificaciones del mismo día para la misma factura
      const existing = await prisma.notification.findFirst({
        where: {
          userId: invoice.lot.createdBy,
          metadata: { path: ['invoiceId'], equals: invoice.id },
          createdAt: { gte: today },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId: invoice.lot.createdBy,
          module: 'collections',
          type: 'collection_due',
          priority: isOverdue ? 'high' : 'medium',
          title: isOverdue
            ? `Cobro vencido — ${invoice.customer.name}`
            : `Cobro próximo a vencer — ${invoice.customer.name}`,
          message: isOverdue
            ? `La factura #${invoice.number} de ${invoice.customer.name} venció hace ${daysOverdue} día(s). Pendiente: $${pendingAmount.toLocaleString('es-CO')}`
            : `La factura #${invoice.number} de ${invoice.customer.name} vence en 2 días. Pendiente: $${pendingAmount.toLocaleString('es-CO')}`,
          href: `/dashboard/collections`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            customerId: invoice.customerId,
            customerName: invoice.customer.name,
            pendingAmount,
            daysOverdue,
          },
        },
      });
      created++;
    }

    sendSuccess(res, { generated: created }, `${created} alertas de cobro generadas`);
  } catch (err) {
    sendServerError(res, err);
  }
}

// DELETE /api/v1/notifications/:id — Eliminar notificación propia
export async function deleteNotification(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const id = String(req.params.id);

    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) { sendNotFound(res, 'Notificación'); return; }

    await prisma.notification.delete({ where: { id } });
    sendSuccess(res, null, 'Notificación eliminada');
  } catch (err) {
    sendServerError(res, err);
  }
}
