// src/controllers/reports.controller.ts
// Módulo 11: Reportes

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { sendSuccess, sendNotFound, sendError, sendServerError } from '../utils/response';

const pid = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

export async function listReports(req: Request, res: Response): Promise<void> {
  try {
    const { category, status, period } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (period) where.period = period;

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { name: true } } },
    });
    sendSuccess(res, reports);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function generateReport(req: Request, res: Response): Promise<void> {
  try {
    const { category, period, format = 'pdf', filters = {} } = req.body as {
      category: string;
      period: string;
      format: string;
      filters: Record<string, unknown>;
    };

    if (!category || !period) {
      sendError(res, 'category y period son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    const validCategories = ['operativo', 'financiero', 'clientes', 'produccion'];
    if (!validCategories.includes(category)) {
      sendError(res, `Categoría inválida. Use: ${validCategories.join(', ')}`, 'VALIDATION_ERROR', 400);
      return;
    }

    const report = await prisma.report.create({
      data: {
        name: `Reporte ${category} - ${period}`,
        category: category as 'operativo' | 'financiero' | 'clientes' | 'produccion',
        period,
        format: format as 'pdf' | 'excel' | 'dashboard',
        status: 'listo',
        ownerId: req.user!.userId,
        filters: filters as Prisma.InputJsonValue,
        generatedAt: new Date(),
      },
    });

    sendSuccess(res, report, 'Reporte generado', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function downloadReport(req: Request, res: Response): Promise<void> {
  const report = await prisma.report.findUnique({ where: { id: pid(req.params.id) } });
  if (!report) { sendNotFound(res, 'Reporte'); return; }
  if (report.status !== 'listo') {
    sendError(res, 'El reporte aún no está disponible para descarga', 'BUSINESS_ERROR', 400);
    return;
  }
  sendSuccess(res, {
    message: 'Descarga de reportes disponible próximamente',
    reportId: report.id,
    format: report.format,
  });
}

export async function scheduleReport(req: Request, res: Response): Promise<void> {
  try {
    const { category, period, format = 'pdf', cronExpression } = req.body as Record<string, string>;
    const report = await prisma.report.create({
      data: {
        name: `Reporte programado ${category} - ${period}`,
        category: category as 'operativo' | 'financiero' | 'clientes' | 'produccion',
        period,
        format: format as 'pdf' | 'excel' | 'dashboard',
        status: 'programado',
        ownerId: req.user!.userId,
        filters: { cronExpression } as Prisma.InputJsonValue,
      },
    });
    sendSuccess(res, report, 'Reporte programado correctamente', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}
