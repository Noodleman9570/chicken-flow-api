// src/controllers/dashboard.controller.ts
// Módulo 01: Dashboard General

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendServerError } from '../utils/response';

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  try {
    const { farmId } = req.query as Record<string, string>;
    const lotWhere: Record<string, unknown> = { status: 'activo' };
    if (farmId) lotWhere.farmId = farmId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      lotesActivos,
      totalPollosVivos,
      facturasMes,
      mortalidadData,
      lotesProximosSacrificio,
    ] = await Promise.all([
      prisma.lot.count({ where: lotWhere }),
      prisma.lot.aggregate({ where: lotWhere, _sum: { birdsAlive: true } }),
      prisma.invoice.findMany({ where: { issueDate: { gte: firstDayMonth }, status: 'pagada' } }),
      prisma.lot.findMany({ where: lotWhere, select: { birdsInitial: true, birdsAlive: true } }),
      prisma.lot.findMany({
        where: { ...lotWhere, expectedHarvestDate: { gte: today, lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) } },
        select: { code: true, expectedHarvestDate: true, birdsAlive: true },
      }),
    ]);

    const totalPollos = totalPollosVivos._sum.birdsAlive ?? 0;
    const mortalidadTotal = mortalidadData.reduce(
      (acc: { inicial: number; muertos: number }, l: { birdsInitial: number; birdsAlive: number }) => ({ inicial: acc.inicial + l.birdsInitial, muertos: acc.muertos + (l.birdsInitial - l.birdsAlive) }),
      { inicial: 0, muertos: 0 }
    );
    const mortalidadRate = mortalidadTotal.inicial > 0
      ? parseFloat(((mortalidadTotal.muertos / mortalidadTotal.inicial) * 100).toFixed(2))
      : 0;
    const ingresosMes = facturasMes.reduce((a: number, f: { subtotal: number }) => a + f.subtotal, 0);

    const metrics = [
      { id: 'active-lots', label: 'Lotes activos', value: lotesActivos, unit: 'lotes', trend: 'neutral' },
      { id: 'live-birds', label: 'Pollos vivos', value: totalPollos, unit: 'aves', trend: 'neutral' },
      { id: 'mortality-rate', label: 'Mortalidad acumulada', value: `${mortalidadRate}%`, trend: mortalidadRate > 5 ? 'down' : 'up' },
      { id: 'monthly-income', label: 'Ingresos del mes', value: ingresosMes, unit: 'COP', trend: 'up' },
    ];

    const alerts: { id: string; type: string; message: string }[] = [];
    if (mortalidadRate > 5) {
      alerts.push({ id: 'alert-mortality', type: 'warning', message: `Mortalidad alta: ${mortalidadRate}%` });
    }
    lotesProximosSacrificio.forEach((lot: { code: string; expectedHarvestDate: Date; birdsAlive: number }) => {
      const dias = Math.ceil((lot.expectedHarvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({ id: `alert-harvest-${lot.code}`, type: 'info', message: `Próximo sacrificio: Lote ${lot.code} en ${dias} días` });
    });

    sendSuccess(res, { metrics, alerts });
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getQuickModules(req: Request, res: Response): Promise<void> {
  try {
    const modules = [
      { label: 'Ciclo de 42 días', href: '/dashboard/cycle/active', enabled: true, icon: '🐣' },
      { label: 'Producción diaria', href: '/dashboard/cycle/daily', enabled: true, icon: '📊' },
      { label: 'Inventario de alimento', href: '/dashboard/cycle/inventory', enabled: true, icon: '🌾' },
      { label: 'Clientes', href: '/dashboard/clients', enabled: true, icon: '👥' },
      { label: 'Facturas y ventas', href: '/dashboard/invoices', enabled: true, icon: '🧾' },
      { label: 'Pagos y cobros', href: '/dashboard/payments', enabled: true, icon: '💰' },
      { label: 'Finanzas', href: '/dashboard/finance', enabled: true, icon: '📈' },
      { label: 'Granjas', href: '/dashboard/farms', enabled: true, icon: '🏡' },
      { label: 'Reportes', href: '/dashboard/reports', enabled: true, icon: '📋' },
    ];
    sendSuccess(res, modules);
  } catch (err) {
    sendServerError(res, err);
  }
}
