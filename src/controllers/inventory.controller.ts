// src/controllers/inventory.controller.ts
// Módulo 06: Inventario de Alimento

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendNotFound, sendError, sendServerError } from '../utils/response';

export async function listInventory(req: Request, res: Response): Promise<void> {
  try {
    const { farmId, feedType, status } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (farmId) where.farmId = farmId;
    if (feedType) where.feedType = feedType;
    if (status) where.status = status;

    const items = await prisma.feedInventory.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { farm: { select: { name: true } } },
    });
    sendSuccess(res, items);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function registerPurchase(req: Request, res: Response): Promise<void> {
  try {
    const { farmId, feedType, brand, quantityKg, unitCost, storageLocation, expirationDate, supplier, invoiceRef } = req.body as Record<string, unknown>;

    if (!farmId || !feedType || !quantityKg || !unitCost) {
      sendError(res, 'farmId, feedType, quantityKg y unitCost son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    // Buscar inventario existente del mismo tipo en la granja
    let inventory = await prisma.feedInventory.findFirst({
      where: { farmId: String(farmId), feedType: feedType as 'iniciador' | 'finalizador' | 'preiniciador', brand: String(brand ?? '') },
    });

    const newStock = (inventory?.stockKg ?? 0) + Number(quantityKg);
    const newStatus = newStock < 40 ? 'critico' : newStock < 120 ? 'bajo' : 'suficiente';

    if (inventory) {
      inventory = await prisma.feedInventory.update({
        where: { id: inventory.id },
        data: { stockKg: newStock, unitCost: Number(unitCost), status: newStatus },
      });
    } else {
      inventory = await prisma.feedInventory.create({
        data: {
          farmId: String(farmId),
          feedType: feedType as 'iniciador' | 'finalizador' | 'preiniciador',
          brand: String(brand ?? ''),
          stockKg: Number(quantityKg),
          unitCost: Number(unitCost),
          storageLocation: storageLocation ? String(storageLocation) : undefined,
          expirationDate: expirationDate ? new Date(String(expirationDate)) : undefined,
          status: newStatus,
        },
      });
    }

    // Registrar compra
    await prisma.feedPurchase.create({
      data: {
        inventoryId: inventory.id,
        quantityKg: Number(quantityKg),
        unitCost: Number(unitCost),
        totalCost: Number(quantityKg) * Number(unitCost),
        purchaseDate: new Date(),
        supplier: supplier ? String(supplier) : undefined,
        invoiceRef: invoiceRef ? String(invoiceRef) : undefined,
      },
    });

    sendSuccess(res, inventory, 'Compra registrada y stock actualizado', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function createReservation(req: Request, res: Response): Promise<void> {
  try {
    const { inventoryId, lotId, reservedKg } = req.body as Record<string, unknown>;

    const inventory = await prisma.feedInventory.findUnique({ where: { id: String(inventoryId) } });
    if (!inventory) { sendNotFound(res, 'Inventario'); return; }

    const available = inventory.stockKg - inventory.reservedKg;
    if (Number(reservedKg) > available) {
      sendError(res, `Solo hay ${available.toFixed(1)} kg disponibles`, 'BUSINESS_ERROR', 400);
      return;
    }

    const updated = await prisma.feedInventory.update({
      where: { id: String(inventoryId) },
      data: { reservedKg: inventory.reservedKg + Number(reservedKg) },
    });
    sendSuccess(res, updated, 'Reserva realizada');
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getInventorySummary(req: Request, res: Response): Promise<void> {
  try {
    const { farmId } = req.query as Record<string, string>;
    const where = farmId ? { farmId } : {};

    const items = await prisma.feedInventory.findMany({ where });

    const totalStock = items.reduce((a: number, i: { stockKg: number }) => a + i.stockKg, 0);
    const totalReserved = items.reduce((a: number, i: { reservedKg: number }) => a + i.reservedKg, 0);
    const valorInventario = items.reduce((a: number, i: { stockKg: number; unitCost: number }) => a + i.stockKg * i.unitCost, 0);
    const criticos = items.filter((i: { status: string }) => i.status === 'critico').length;
    const bajos = items.filter((i: { status: string }) => i.status === 'bajo').length;

    sendSuccess(res, {
      totalStockKg: parseFloat(totalStock.toFixed(2)),
      totalReservadoKg: parseFloat(totalReserved.toFixed(2)),
      disponibleKg: parseFloat((totalStock - totalReserved).toFixed(2)),
      valorInventario: Math.round(valorInventario),
      itemsCriticos: criticos,
      itemsBajos: bajos,
      items,
    });
  } catch (err) {
    sendServerError(res, err);
  }
}
