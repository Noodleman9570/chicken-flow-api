// src/controllers/farms.controller.ts
// Módulo 02: Granjas e Infraestructura

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import {
  sendSuccess, sendPaginated, sendError, sendNotFound, sendServerError, getPaginationParams,
} from '../utils/response';

const pid = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

export async function listFarms(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const { search, status } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: { where: { isResponsible: true }, include: { farm: { select: { name: true } } } },
          _count: { select: { lots: { where: { status: 'activo' } } } },
        },
      }),
      prisma.farm.count({ where }),
    ]);

    sendPaginated(res, farms, total, page, limit);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getFarm(req: Request, res: Response): Promise<void> {
  try {
    const farm = await prisma.farm.findUnique({
      where: { id: pid(req.params.id) },
      include: {
        lots: { where: { status: { in: ['activo', 'programado'] } }, orderBy: { startDate: 'asc' } },
        feedInventory: true,
      },
    });
    if (!farm) { sendNotFound(res, 'Granja'); return; }
    sendSuccess(res, farm);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function createFarm(req: Request, res: Response): Promise<void> {
  try {
    const { name, location, areaM2, zones, capacity, responsibleUserId, nextMaintenance } = req.body;

    if (!name || !location || !areaM2 || !zones || !capacity) {
      sendError(res, 'Nombre, ubicación, área, zonas y capacidad son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    const farm = await prisma.farm.create({
      data: {
        name,
        location,
        areaM2,
        zones,
        capacity,
        nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : undefined,
        ...(responsibleUserId && {
          users: { create: { userId: responsibleUserId, isResponsible: true } },
        }),
      },
    });

    sendSuccess(res, farm, 'Granja creada correctamente', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function updateFarm(req: Request, res: Response): Promise<void> {
  try {
    const existing = await prisma.farm.findUnique({ where: { id: pid(req.params.id) } });
    if (!existing) { sendNotFound(res, 'Granja'); return; }

    const { name, location, areaM2, zones, capacity, status, nextMaintenance } = req.body;

    const farm = await prisma.farm.update({
      where: { id: pid(req.params.id) },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(areaM2 && { areaM2 }),
        ...(zones && { zones }),
        ...(capacity && { capacity }),
        ...(status && { status }),
        ...(nextMaintenance && { nextMaintenance: new Date(nextMaintenance) }),
      },
    });

    sendSuccess(res, farm, 'Granja actualizada');
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getFarmOptions(req: Request, res: Response): Promise<void> {
  try {
    const farms = await prisma.farm.findMany({
      where: { status: 'activa' },
      select: { id: true, name: true, location: true, capacity: true, zones: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, farms);
  } catch (err) {
    sendServerError(res, err);
  }
}
