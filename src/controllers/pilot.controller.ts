// src/controllers/pilot.controller.ts
// Módulo 03: Módulo Piloto + Endpoints de endpoints-avicola.md

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import {
  sendSuccess, sendError, sendNotFound, sendServerError, getPaginationParams,
} from '../utils/response';
import {
  calcularFCR, calcularMortalidad, calcularPesoPromedio, calcularCostosLote,
  calcularRentabilidad, calcularAlimentoNecesario, evaluarIndicador,
} from '../utils/calculations';

// Helper: normaliza req.params.id a string (Express 5 / Prisma v7 requieren string estricto)
const pid = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

// --- Genera código de lote único (L-YYYY-NNN) ---
async function generateLotCode(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.lot.count();
  return `L-${year}-${String(count + 1).padStart(3, '0')}`;
}

// --- Helpers de validación ---
function validateLotBody(body: Record<string, unknown>): string | null {
  const { birdsInitial, durationDays, pricePollito, priceIniciador, priceFinalizador, priceSaleLb } = body as Record<string, number>;
  if (!birdsInitial || birdsInitial < 12 || birdsInitial > 500 || birdsInitial % 12 !== 0) {
    return 'Cantidad de pollitos debe ser múltiplo de 12 entre 12 y 500';
  }
  if (durationDays && (durationDays < 35 || durationDays > 49)) {
    return 'Duración del ciclo debe estar entre 35 y 49 días';
  }
  if (!pricePollito || pricePollito <= 0) return 'Precio del pollito debe ser mayor a 0';
  if (!priceIniciador || priceIniciador <= 0) return 'Precio del alimento iniciador debe ser mayor a 0';
  if (!priceFinalizador || priceFinalizador <= 0) return 'Precio del alimento finalizador debe ser mayor a 0';
  if (!priceSaleLb || priceSaleLb <= 0) return 'Precio de venta por libra debe ser mayor a 0';
  return null;
}

// =====================
// LOTES PILOTO
// =====================

export async function listLots(req: Request, res: Response): Promise<void> {
  try {
    const { status, farmId, activeOnly } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (farmId) where.farmId = farmId;
    if (status) where.status = status;
    if (activeOnly === 'true') where.status = 'activo';

    const lots = await prisma.lot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { farm: { select: { name: true, location: true } } },
    });

    sendSuccess(res, lots);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getLot(req: Request, res: Response): Promise<void> {
  try {
    const lot = await prisma.lot.findUnique({
      where: { id: pid(req.params.id) },
      include: {
        farm: { select: { name: true, location: true } },
        dailyRecords: { orderBy: { cyclDay: 'asc' } },
        weeklyRecords: { orderBy: { weekNumber: 'asc' } },
      },
    });
    if (!lot) { sendNotFound(res, 'Lote'); return; }
    sendSuccess(res, lot);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function createLot(req: Request, res: Response): Promise<void> {
  try {
    const validationError = validateLotBody(req.body);
    if (validationError) { sendError(res, validationError, 'VALIDATION_ERROR', 400); return; }

    const {
      farmId, zone, birdsInitial, durationDays = 42, startDate,
      pricePollito, priceIniciador, priceFinalizador, priceViruta = 0,
      priceVacunas = 0, costCalefaccion = 0, costTransporte = 0,
      costProcesamiento = 0, costEntrega = 0, priceSaleLb,
      expectedWeightKg, expectedCarcassKg, observationsInitial,
    } = req.body as Record<string, unknown>;

    // Validar granja existe
    if (farmId) {
      const farm = await prisma.farm.findUnique({ where: { id: String(farmId) } });
      if (!farm) { sendError(res, 'Granja no encontrada', 'NOT_FOUND', 404); return; }
    }

    const start = startDate ? new Date(String(startDate)) : new Date();
    const harvest = new Date(start);
    harvest.setDate(harvest.getDate() + Number(durationDays));

    const code = await generateLotCode();

    const lot = await prisma.lot.create({
      data: {
        code,
        farmId: String(farmId),
        zone: zone ? String(zone) : undefined,
        birdsInitial: Number(birdsInitial),
        birdsAlive: Number(birdsInitial),
        durationDays: Number(durationDays),
        startDate: start,
        expectedHarvestDate: harvest,
        status: 'activo',
        pricePollito: Number(pricePollito),
        priceIniciador: Number(priceIniciador),
        priceFinalizador: Number(priceFinalizador),
        priceViruta: Number(priceViruta),
        priceVacunas: Number(priceVacunas),
        costCalefaccion: Number(costCalefaccion),
        costTransporte: Number(costTransporte),
        costProcesamiento: Number(costProcesamiento),
        costEntrega: Number(costEntrega),
        priceSaleLb: Number(priceSaleLb),
        expectedWeightKg: expectedWeightKg ? Number(expectedWeightKg) : undefined,
        expectedCarcassKg: expectedCarcassKg ? Number(expectedCarcassKg) : undefined,
        observationsInitial: observationsInitial ? String(observationsInitial) : undefined,
        createdBy: req.user!.userId,
      },
    });

    sendSuccess(res, lot, 'Lote creado correctamente', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function updateLot(req: Request, res: Response): Promise<void> {
  try {
    const existing = await prisma.lot.findUnique({ where: { id: pid(req.params.id) } });
    if (!existing) { sendNotFound(res, 'Lote'); return; }

    const { status, observationsInitial, expectedWeightKg, expectedCarcassKg, priceSaleLb, zone } = req.body;

    const lot = await prisma.lot.update({
      where: { id: pid(req.params.id) },
      data: {
        ...(status && { status }),
        ...(observationsInitial !== undefined && { observationsInitial }),
        ...(expectedWeightKg && { expectedWeightKg }),
        ...(expectedCarcassKg && { expectedCarcassKg }),
        ...(priceSaleLb && { priceSaleLb }),
        ...(zone && { zone }),
      },
    });
    sendSuccess(res, lot, 'Lote actualizado');
  } catch (err) {
    sendServerError(res, err);
  }
}

// =====================
// REGISTROS DIARIOS
// =====================

export async function listDailyRecords(req: Request, res: Response): Promise<void> {
  try {
    const lot = await prisma.lot.findUnique({ where: { id: pid(req.params.id) } });
    if (!lot) { sendNotFound(res, 'Lote'); return; }

    const records = await prisma.dailyRecord.findMany({
      where: { lotId: pid(req.params.id) },
      orderBy: { cyclDay: 'asc' },
    });
    sendSuccess(res, records);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function createDailyRecord(req: Request, res: Response): Promise<void> {
  try {
    const lot = await prisma.lot.findUnique({ where: { id: pid(req.params.id) } });
    if (!lot) { sendNotFound(res, 'Lote'); return; }
    if (lot.status !== 'activo') {
      sendError(res, 'Solo se pueden agregar registros a lotes activos', 'BUSINESS_ERROR', 400);
      return;
    }

    const {
      cyclDay, date, birdsAliveStart, deadBirds = 0, deathCause,
      feedKg, feedType, waterChanged = true, temperatureMorning, temperatureAfternoon, observations,
    } = req.body as Record<string, unknown>;

    // Validaciones de negocio
    if (!cyclDay || Number(cyclDay) < 1 || Number(cyclDay) > lot.durationDays) {
      sendError(res, `Día del ciclo debe estar entre 1 y ${lot.durationDays}`, 'VALIDATION_ERROR', 400);
      return;
    }
    if (!birdsAliveStart || Number(birdsAliveStart) < 0) {
      sendError(res, 'Pollos vivos al inicio debe ser mayor o igual a 0', 'VALIDATION_ERROR', 400);
      return;
    }
    if (Number(birdsAliveStart) > lot.birdsAlive) {
      sendError(res, 'Los pollos vivos no pueden aumentar respecto al día anterior', 'BUSINESS_ERROR', 400);
      return;
    }
    if (temperatureMorning && (Number(temperatureMorning) < 10 || Number(temperatureMorning) > 45)) {
      sendError(res, 'Temperatura debe estar entre 10°C y 45°C', 'VALIDATION_ERROR', 400);
      return;
    }
    if (!feedKg || Number(feedKg) < 0) {
      sendError(res, 'Alimento echado debe ser mayor o igual a 0', 'VALIDATION_ERROR', 400);
      return;
    }

    const record = await prisma.dailyRecord.create({
      data: {
        lotId: pid(req.params.id),
        cyclDay: Number(cyclDay),
        date: date ? new Date(String(date)) : new Date(),
        birdsAliveStart: Number(birdsAliveStart),
        deadBirds: Number(deadBirds),
        deathCause: deathCause ? String(deathCause) : undefined,
        feedKg: Number(feedKg),
        feedType: (feedType as 'iniciador' | 'finalizador') ?? 'iniciador',
        waterChanged: Boolean(waterChanged),
        temperatureMorning: temperatureMorning ? Number(temperatureMorning) : undefined,
        temperatureAfternoon: temperatureAfternoon ? Number(temperatureAfternoon) : undefined,
        observations: observations ? String(observations) : undefined,
        operatorId: req.user?.userId,
      },
    });

    // Actualizar pollos vivos en el lote
    await prisma.lot.update({
      where: { id: pid(req.params.id) },
      data: { birdsAlive: Number(birdsAliveStart) - Number(deadBirds) },
    });

    // Alerta si mortalidad supera 5%
    const mortalidad = calcularMortalidad(lot.birdsInitial, lot.birdsInitial - (Number(birdsAliveStart) - Number(deadBirds)));
    const alerts = mortalidad > 5 ? [`Alerta: Mortalidad acumulada en ${mortalidad}%`] : [];

    sendSuccess(res, { record, alerts }, 'Registro diario creado', 201);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      sendError(res, 'Ya existe un registro para ese día del ciclo', 'BUSINESS_ERROR', 409);
      return;
    }
    sendServerError(res, err);
  }
}

export async function updateDailyRecord(req: Request, res: Response): Promise<void> {
  try {
    const record = await prisma.dailyRecord.findUnique({ where: { id: pid(req.params.recordId) } });
    if (!record) { sendNotFound(res, 'Registro diario'); return; }

    const { deadBirds, observations, waterChanged, temperatureMorning, temperatureAfternoon, feedKg } = req.body;

    const updated = await prisma.dailyRecord.update({
      where: { id: pid(req.params.recordId) },
      data: {
        ...(deadBirds !== undefined && { deadBirds: Number(deadBirds) }),
        ...(observations !== undefined && { observations }),
        ...(waterChanged !== undefined && { waterChanged: Boolean(waterChanged) }),
        ...(temperatureMorning !== undefined && { temperatureMorning: Number(temperatureMorning) }),
        ...(temperatureAfternoon !== undefined && { temperatureAfternoon: Number(temperatureAfternoon) }),
        ...(feedKg !== undefined && { feedKg: Number(feedKg) }),
      },
    });
    sendSuccess(res, updated, 'Registro diario actualizado');
  } catch (err) {
    sendServerError(res, err);
  }
}

// =====================
// REGISTROS SEMANALES
// =====================

export async function listWeeklyRecords(req: Request, res: Response): Promise<void> {
  try {
    const lot = await prisma.lot.findUnique({ where: { id: pid(req.params.id) } });
    if (!lot) { sendNotFound(res, 'Lote'); return; }

    const records = await prisma.weeklyRecord.findMany({
      where: { lotId: pid(req.params.id) },
      orderBy: { weekNumber: 'asc' },
    });
    sendSuccess(res, records);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function createWeeklyRecord(req: Request, res: Response): Promise<void> {
  try {
    const lot = await prisma.lot.findUnique({ where: { id: pid(req.params.id) } });
    if (!lot) { sendNotFound(res, 'Lote'); return; }

    const {
      weekNumber, startDay, endDay, weighingDate,
      bird1WeightG, bird2WeightG, bird3WeightG, bird4WeightG, bird5WeightG,
      feedConsumedKg, deadBirdsWeek = 0, observations,
    } = req.body as Record<string, unknown>;

    const pesos = [bird1WeightG, bird2WeightG, bird3WeightG, bird4WeightG, bird5WeightG].map(Number);

    // Validaciones
    if (pesos.some((p) => p <= 0 || p > 5000)) {
      sendError(res, 'Pesos de pollos deben estar entre 0 y 5000 gramos', 'VALIDATION_ERROR', 400);
      return;
    }
    const mortalidadSemana = lot.birdsAlive > 0
      ? (Number(deadBirdsWeek) / lot.birdsAlive) * 100
      : 0;
    if (mortalidadSemana > 20) {
      sendError(res, 'Mortalidad semanal no puede superar el 20%', 'BUSINESS_ERROR', 400);
      return;
    }

    const avgWeightG = calcularPesoPromedio(pesos);

    const record = await prisma.weeklyRecord.create({
      data: {
        lotId: pid(req.params.id),
        weekNumber: Number(weekNumber),
        startDay: Number(startDay),
        endDay: Number(endDay),
        weighingDate: weighingDate ? new Date(String(weighingDate)) : new Date(),
        bird1WeightG: Number(bird1WeightG),
        bird2WeightG: Number(bird2WeightG),
        bird3WeightG: Number(bird3WeightG),
        bird4WeightG: Number(bird4WeightG),
        bird5WeightG: Number(bird5WeightG),
        avgWeightG,
        feedConsumedKg: Number(feedConsumedKg),
        deadBirdsWeek: Number(deadBirdsWeek),
        observations: observations ? String(observations) : undefined,
      },
    });
    sendSuccess(res, record, 'Registro semanal creado', 201);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      sendError(res, 'Ya existe un registro para esa semana', 'BUSINESS_ERROR', 409);
      return;
    }
    sendServerError(res, err);
  }
}

// =====================
// RESUMEN Y REPORTE FINAL
// =====================

export async function getLotSummary(req: Request, res: Response): Promise<void> {
  try {
    const lot = await prisma.lot.findUnique({
      where: { id: pid(req.params.id) },
      include: {
        dailyRecords: { orderBy: { cyclDay: 'asc' } },
        weeklyRecords: { orderBy: { weekNumber: 'asc' } },
      },
    });
    if (!lot) { sendNotFound(res, 'Lote'); return; }

    const totalMuertos = lot.birdsInitial - lot.birdsAlive;
    const mortalidad = calcularMortalidad(lot.birdsInitial, totalMuertos);
    const totalAlimento = lot.dailyRecords.reduce((acc: number, r: { feedKg: number }) => acc + r.feedKg, 0);
    const lastWeekly = lot.weeklyRecords.at(-1);
    const pesoPromedio = lastWeekly ? lastWeekly.avgWeightG ?? 0 : 0;
    const pesoPromedioKg = pesoPromedio / 1000;
    const fcr = calcularFCR(totalAlimento, lot.birdsAlive, pesoPromedioKg);

    const { costoTotal } = calcularCostosLote({
      cantidadPollitos: lot.birdsInitial,
      precioPollito: lot.pricePollito,
      precioIniciador: lot.priceIniciador,
      precioFinalizador: lot.priceFinalizador,
      precioViruta: lot.priceViruta,
      precioVacunas: lot.priceVacunas,
      costoCalefaccion: lot.costCalefaccion,
      costoTransporte: lot.costTransporte,
      costosProcesamiento: lot.costProcesamiento,
      costoEntrega: lot.costEntrega,
    });

    const { ingresosEstimados, gananciaNeta, rentabilidad } = calcularRentabilidad({
      pollosVivos: lot.birdsAlive,
      pesoPromedioKg,
      pesoCanal: lot.expectedCarcassKg ?? 0.76,
      precioVentaLb: lot.priceSaleLb,
      costoTotal,
    });

    const resumen = {
      pollosVivosActuales: lot.birdsAlive,
      mortalidadAcumulada: mortalidad,
      alimentoConsumidoTotal: parseFloat(totalAlimento.toFixed(2)),
      pesoPromedioActualG: pesoPromedio,
      fcrActual: fcr,
      costoAcumulado: costoTotal,
      ingresosEstimados,
      gananciaNeta,
      rentabilidad,
    };

    sendSuccess(res, {
      lote: { ...lot, dailyRecords: undefined, weeklyRecords: undefined },
      resumen,
      registrosDiarios: lot.dailyRecords,
      registrosSemanales: lot.weeklyRecords,
    });
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getFinalReport(req: Request, res: Response): Promise<void> {
  try {
    const lot = await prisma.lot.findUnique({
      where: { id: pid(req.params.id) },
      include: {
        dailyRecords: true,
        weeklyRecords: { orderBy: { weekNumber: 'asc' } },
      },
    });
    if (!lot) { sendNotFound(res, 'Lote'); return; }

    const totalMuertos = lot.birdsInitial - lot.birdsAlive;
    const mortalidadFinal = calcularMortalidad(lot.birdsInitial, totalMuertos);
    const totalAlimento = lot.dailyRecords.reduce((acc: number, r: { feedKg: number }) => acc + r.feedKg, 0);
    const lastWeekly = lot.weeklyRecords.at(-1);
    const pesoFinalG = lastWeekly?.avgWeightG ?? 0;
    const pesoFinalKg = pesoFinalG / 1000;
    const fcrFinal = calcularFCR(totalAlimento, lot.birdsAlive, pesoFinalKg);
    const diasCiclo = lot.dailyRecords.length;

    const { costoTotal } = calcularCostosLote({
      cantidadPollitos: lot.birdsInitial,
      precioPollito: lot.pricePollito,
      precioIniciador: lot.priceIniciador,
      precioFinalizador: lot.priceFinalizador,
      precioViruta: lot.priceViruta,
      precioVacunas: lot.priceVacunas,
      costoCalefaccion: lot.costCalefaccion,
      costoTransporte: lot.costTransporte,
      costosProcesamiento: lot.costProcesamiento,
      costoEntrega: lot.costEntrega,
    });

    const { ingresosEstimados, gananciaNeta, rentabilidad } = calcularRentabilidad({
      pollosVivos: lot.birdsAlive,
      pesoPromedioKg: pesoFinalKg,
      pesoCanal: lot.expectedCarcassKg ?? 0.76,
      precioVentaLb: lot.priceSaleLb,
      costoTotal,
    });

    const costoPorPollo = lot.birdsAlive > 0 ? Math.round(costoTotal / lot.birdsAlive) : 0;
    const ingresoPorPollo = lot.birdsAlive > 0 ? Math.round(ingresosEstimados / lot.birdsAlive) : 0;

    const recomendaciones: string[] = [];
    if (mortalidadFinal > 5) recomendaciones.push('Reducir mortalidad: Revisar bioseguridad y manejo sanitario');
    if (fcrFinal > 2.0) recomendaciones.push('Mejorar FCR: Revisar calidad del alimento y manejo de comederos');
    if (rentabilidad > 10) recomendaciones.push('Considerar escalar a ciclos escalonados para mayor volumen');
    if (recomendaciones.length === 0) recomendaciones.push('Excelente ciclo, mantener las prácticas actuales');

    sendSuccess(res, {
      datosFinalies: {
        pollosIniciales: lot.birdsInitial,
        pollosFinales: lot.birdsAlive,
        mortalidadFinal,
        pesoFinalG,
        fcrFinal,
        diasCiclo,
      },
      analisisFinanciero: {
        costosTotales: costoTotal,
        ingresosTotales: ingresosEstimados,
        gananciaNeta,
        rentabilidad,
        costoPorPollo,
        ingresoPorPollo,
      },
      indicadoresClave: {
        mortalidad: { valor: mortalidadFinal, estado: evaluarIndicador('mortalidad', mortalidadFinal) },
        fcr: { valor: fcrFinal, estado: evaluarIndicador('fcr', fcrFinal) },
        peso: { valor: pesoFinalG, estado: evaluarIndicador('peso', pesoFinalG) },
        rentabilidad: { valor: rentabilidad, estado: evaluarIndicador('rentabilidad', rentabilidad) },
      },
      recomendaciones,
    });
  } catch (err) {
    sendServerError(res, err);
  }
}

// =====================
// CÁLCULOS DE UTILIDAD
// =====================

export async function calcularAlimento(req: Request, res: Response): Promise<void> {
  try {
    const qty = parseInt(Array.isArray(req.params.cantidadPollitos) ? req.params.cantidadPollitos[0] : req.params.cantidadPollitos);
    if (isNaN(qty) || qty < 1) {
      sendError(res, 'Cantidad de pollitos inválida', 'VALIDATION_ERROR', 400);
      return;
    }

    const calc = calcularAlimentoNecesario(qty);
    const precioIniciador = Number(req.query.precioIniciador ?? 0);
    const precioFinalizador = Number(req.query.precioFinalizador ?? 0);

    sendSuccess(res, {
      ...calc,
      costoTotalAlimento: precioIniciador && precioFinalizador
        ? Math.round(
            (calc.iniciadorNecesarioKg / 40) * precioIniciador +
            (calc.finalizadorNecesarioKg / 40) * precioFinalizador
          )
        : null,
    });
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function calcularViabilidad(req: Request, res: Response): Promise<void> {
  try {
    const {
      cantidadPollitos, precioPollito, priceIniciador, priceFinalizador,
      priceViruta = 0, priceVacunas = 0, costCalefaccion = 0, costTransporte = 0,
      costProcesamiento = 0, costEntrega = 0, priceSaleLb,
      expectedWeightKg = 2.5, expectedCarcassKg = 0.76,
    } = req.body as Record<string, number>;

    const validationError = validateLotBody({ ...req.body, birdsInitial: cantidadPollitos });
    if (validationError) { sendError(res, validationError, 'VALIDATION_ERROR', 400); return; }

    const { costoTotal, costoAlimento, costosDirectos } = calcularCostosLote({
      cantidadPollitos,
      precioPollito,
      precioIniciador: priceIniciador,
      precioFinalizador: priceFinalizador,
      precioViruta: priceViruta,
      precioVacunas: priceVacunas,
      costoCalefaccion: costCalefaccion,
      costoTransporte: costTransporte,
      costosProcesamiento: costProcesamiento,
      costoEntrega: costEntrega,
    });

    const { ingresosEstimados, gananciaNeta, rentabilidad } = calcularRentabilidad({
      pollosVivos: cantidadPollitos,
      pesoPromedioKg: expectedWeightKg,
      pesoCanal: expectedCarcassKg,
      precioVentaLb: priceSaleLb,
      costoTotal,
    });

    const alertas: string[] = [];
    if (rentabilidad < 5) alertas.push('Rentabilidad baja: Verificar precios de venta o reducir costos');
    if (gananciaNeta < 0) alertas.push('Pérdida proyectada: El lote no es viable con los precios actuales');

    const recomendaciones: string[] = [];
    if (rentabilidad >= 10) recomendaciones.push('Buen potencial de rentabilidad');
    if (rentabilidad < 5 && rentabilidad >= 0) recomendaciones.push('Negociar mejor precio de venta o reducir costos de alimento');

    sendSuccess(res, {
      viable: gananciaNeta > 0,
      desgloseCostos: { costoAlimento, costosDirectos, costoTotal },
      ingresoEstimado: ingresosEstimados,
      gananciaEstimada: gananciaNeta,
      rentabilidad,
      inversionInicial: costoTotal,
      alertas,
      recomendaciones,
    });
  } catch (err) {
    sendServerError(res, err);
  }
}
