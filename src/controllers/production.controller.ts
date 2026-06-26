// src/controllers/production.controller.ts
// Módulo 05: Producción Diaria Multi-Lote

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../utils/response';

const pid = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

export async function listProductionRecords(req: Request, res: Response): Promise<void> {
  try {
    const { date, lotId, farmId, operatorId } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (lotId) where.lotId = lotId;
    if (operatorId) where.operatorId = operatorId;
    if (date) where.date = new Date(date);
    if (farmId) where.lot = { farmId };

    const records = await prisma.dailyRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        lot: { select: { code: true, farmId: true, farm: { select: { name: true } } } },
        operator: { select: { name: true } },
      },
    });
    sendSuccess(res, records);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function createProductionRecord(req: Request, res: Response): Promise<void> {
  try {
    const { lotId, date, deadBirds = 0, feedKg, waterChanged = true, temperatureMorning, temperatureAfternoon, observations } = req.body as Record<string, unknown>;

    if (!lotId || !feedKg) {
      sendError(res, 'lotId y feedKg son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }
    if (Number(deadBirds) < 0) {
      sendError(res, 'deadBirds no puede ser negativo', 'VALIDATION_ERROR', 400);
      return;
    }
    if (Number(feedKg) < 0) {
      sendError(res, 'feedKg debe ser mayor o igual a 0', 'VALIDATION_ERROR', 400);
      return;
    }

    const lot = await prisma.lot.findUnique({ where: { id: String(lotId) } });
    if (!lot) { sendNotFound(res, 'Lote'); return; }

    // Calcular día del ciclo basado en la fecha de inicio del lote
    const recordDate = date ? new Date(String(date)) : new Date();
    const diffMs = recordDate.getTime() - lot.startDate.getTime();
    const cyclDay = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    const record = await prisma.dailyRecord.create({
      data: {
        lotId: String(lotId),
        cyclDay,
        date: recordDate,
        birdsAliveStart: lot.birdsAlive,
        deadBirds: Number(deadBirds),
        feedKg: Number(feedKg),
        feedType: cyclDay <= 21 ? 'iniciador' : 'finalizador',
        waterChanged: Boolean(waterChanged),
        temperatureMorning: temperatureMorning ? Number(temperatureMorning) : undefined,
        temperatureAfternoon: temperatureAfternoon ? Number(temperatureAfternoon) : undefined,
        observations: observations ? String(observations) : undefined,
        operatorId: req.user?.userId,
      },
    });

    await prisma.lot.update({
      where: { id: String(lotId) },
      data: { birdsAlive: lot.birdsAlive - Number(deadBirds) },
    });

    sendSuccess(res, record, 'Registro de producción creado', 201);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      sendError(res, 'Ya existe un registro para ese lote en esa fecha', 'BUSINESS_ERROR', 409);
      return;
    }
    sendServerError(res, err);
  }
}

export async function updateProductionRecord(req: Request, res: Response): Promise<void> {
  try {
    const record = await prisma.dailyRecord.findUnique({ where: { id: pid(req.params.id) } });
    if (!record) { sendNotFound(res, 'Registro'); return; }

    const { deadBirds, feedKg, waterChanged, temperatureMorning, temperatureAfternoon, observations } = req.body;

    const updated = await prisma.dailyRecord.update({
      where: { id: pid(req.params.id) },
      data: {
        ...(deadBirds !== undefined && { deadBirds: Number(deadBirds) }),
        ...(feedKg !== undefined && { feedKg: Number(feedKg) }),
        ...(waterChanged !== undefined && { waterChanged: Boolean(waterChanged) }),
        ...(temperatureMorning !== undefined && { temperatureMorning: Number(temperatureMorning) }),
        ...(temperatureAfternoon !== undefined && { temperatureAfternoon: Number(temperatureAfternoon) }),
        ...(observations !== undefined && { observations }),
      },
    });
    sendSuccess(res, updated, 'Registro actualizado');
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getProductionSummary(req: Request, res: Response): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecords = await prisma.dailyRecord.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: { lot: { select: { code: true, farmId: true } } },
    });

    const activeLots = await prisma.lot.findMany({ where: { status: 'activo' } });

    const totalAlimento = todayRecords.reduce((a: number, r: { feedKg: number }) => a + r.feedKg, 0);
    const totalMortalidad = todayRecords.reduce((a: number, r: { deadBirds: number }) => a + r.deadBirds, 0);
    const tempProm = todayRecords
      .filter((r: { temperatureMorning: number | null }) => r.temperatureMorning)
      .map((r: { temperatureMorning: number | null }) => r.temperatureMorning!)
      .reduce((a: number, b: number, _: number, arr: number[]) => a + b / arr.length, 0);

    sendSuccess(res, {
      fecha: today,
      lotesActivos: activeLots.length,
      registrosHoy: todayRecords.length,
      registrosPendientes: activeLots.length - todayRecords.length,
      totalAlimentoKg: parseFloat(totalAlimento.toFixed(2)),
      totalMortalidad,
      temperaturaPromedio: parseFloat(tempProm.toFixed(1)),
    });
  } catch (err) {
    sendServerError(res, err);
  }
}
