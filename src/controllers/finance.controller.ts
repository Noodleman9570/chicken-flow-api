// src/controllers/finance.controller.ts
// Módulo 10: Finanzas y Utilidades

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../utils/response';

export async function listDistributions(req: Request, res: Response): Promise<void> {
  try {
    const distributions = await prisma.financialDistribution.findMany({
      orderBy: { period: 'desc' },
    });
    sendSuccess(res, distributions);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function closePeriod(req: Request, res: Response): Promise<void> {
  try {
    const { period, includeLots = [], distributionRule } = req.body as {
      period: string;
      includeLots: string[];
      distributionRule: {
        reinvestment: number;
        emergencyFund: number;
        dividends: number;
        founderShare: number;
        operatorShare: number;
      };
    };

    if (!period || !distributionRule) {
      sendError(res, 'period y distributionRule son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    const totalPct = distributionRule.reinvestment + distributionRule.emergencyFund + distributionRule.dividends;
    if (Math.abs(totalPct - 100) > 0.01) {
      sendError(res, 'Los porcentajes de distribución deben sumar 100%', 'VALIDATION_ERROR', 400);
      return;
    }

    // Calcular ingresos del periodo desde facturas pagadas
    const [dateFrom, dateTo] = getPeriodDates(period);
    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'pagada',
        issueDate: { gte: dateFrom, lte: dateTo },
        ...(includeLots.length > 0 && { lotId: { in: includeLots } }),
      },
    });

    const grossIncome = invoices.reduce((a: number, inv: { subtotal: number }) => a + inv.subtotal, 0);
    const operatingCosts = await calcOperatingCosts(includeLots);
    const salariesAndServices = 0; // Configurar según necesidades
    const netProfit = grossIncome - operatingCosts - salariesAndServices;

    const reinvestmentAmount = (netProfit * distributionRule.reinvestment) / 100;
    const emergencyFundAmount = (netProfit * distributionRule.emergencyFund) / 100;
    const dividendsAmount = (netProfit * distributionRule.dividends) / 100;
    const founderShareAmount = (dividendsAmount * distributionRule.founderShare) / 100;
    const operatorShareAmount = (dividendsAmount * distributionRule.operatorShare) / 100;
    const margin = grossIncome > 0 ? (netProfit / grossIncome) * 100 : 0;

    const distribution = await prisma.financialDistribution.upsert({
      where: { period },
      create: {
        period,
        grossIncome,
        operatingCosts,
        salariesAndServices,
        netProfit,
        reinvestmentPct: distributionRule.reinvestment,
        emergencyFundPct: distributionRule.emergencyFund,
        dividendsPct: distributionRule.dividends,
        founderSharePct: distributionRule.founderShare,
        operatorSharePct: distributionRule.operatorShare,
        reinvestmentAmount,
        emergencyFundAmount,
        dividendsAmount,
        founderShareAmount,
        operatorShareAmount,
        margin,
        includedLots: includeLots,
      },
      update: {
        grossIncome,
        operatingCosts,
        netProfit,
        reinvestmentAmount,
        emergencyFundAmount,
        dividendsAmount,
        founderShareAmount,
        operatorShareAmount,
        margin,
        includedLots: includeLots,
      },
    });

    sendSuccess(res, distribution, 'Cierre financiero generado', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getFinanceSummary(req: Request, res: Response): Promise<void> {
  try {
    const { period } = req.query as { period?: string };
    const currentPeriod = period ?? new Date().toISOString().substring(0, 7);
    const [dateFrom, dateTo] = getPeriodDates(currentPeriod);

    const [invoices, lots] = await Promise.all([
      prisma.invoice.findMany({
        where: { issueDate: { gte: dateFrom, lte: dateTo } },
      }),
      prisma.lot.findMany({
        where: { startDate: { gte: dateFrom, lte: dateTo } },
      }),
    ]);

    const totalFacturado = invoices.reduce((a: number, i: { subtotal: number }) => a + i.subtotal, 0);
    const totalPagado = invoices.reduce((a: number, i: { paidAmount: number }) => a + i.paidAmount, 0);
    const totalPendiente = totalFacturado - totalPagado;

    sendSuccess(res, {
      periodo: currentPeriod,
      totalFacturado,
      totalPagado,
      totalPendiente,
      lotesEnPeriodo: lots.length,
    });
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getProjections(req: Request, res: Response): Promise<void> {
  try {
    const distributions = await prisma.financialDistribution.findMany({
      orderBy: { period: 'asc' },
      take: 6,
    });
    sendSuccess(res, { historico: distributions, proyeccion: 'En desarrollo' });
  } catch (err) {
    sendServerError(res, err);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getPeriodDates(period: string): [Date, Date] {
  const [year, month] = period.split('-').map(Number);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59);
  return [from, to];
}

async function calcOperatingCosts(lotIds: string[]): Promise<number> {
  if (lotIds.length === 0) return 0;
  const lots = await prisma.lot.findMany({ where: { id: { in: lotIds } } });
  return lots.reduce((a: number, lot: { pricePollito: number; birdsInitial: number; priceViruta: number; priceVacunas: number; costCalefaccion: number; costTransporte: number; costProcesamiento: number; costEntrega: number }) => {
    const costs =
      lot.pricePollito * lot.birdsInitial +
      lot.priceViruta +
      lot.priceVacunas +
      lot.costCalefaccion +
      lot.costTransporte +
      lot.costProcesamiento +
      lot.costEntrega;
    return a + costs;
  }, 0);
}
