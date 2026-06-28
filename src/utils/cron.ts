// src/utils/cron.ts
// Cron jobs automáticos del sistema Chicken Flow

import cron from 'node-cron';
import prisma from '../config/prisma';

export interface CronJobDefinition {
  id: string;
  name: string;
  description: string;
  schedule: string;         // expresión cron
  scheduleLabel: string;    // legible para humanos
  enabled: boolean;
  lastRun?: Date;
  lastResult?: string;
}

// Registro de jobs disponibles (compartido con el controller de admin)
export const CRON_JOBS: CronJobDefinition[] = [
  {
    id: 'lot-daily-notifications',
    name: 'Notificaciones Diarias de Lote',
    description: 'Genera tareas y alertas del día para cada lote activo (vacunas, pesajes, cambio alimento, etc.)',
    schedule: '0 8 * * *',         // todos los días a las 8:00 AM
    scheduleLabel: 'Diario 08:00 AM',
    enabled: true,
  },
  {
    id: 'collection-alerts',
    name: 'Alertas de Cobros Vencidos',
    description: 'Genera notificaciones para facturas vencidas o próximas a vencer (≤2 días)',
    schedule: '0 7 * * *',         // todos los días a las 7:00 AM
    scheduleLabel: 'Diario 07:00 AM',
    enabled: true,
  },
  {
    id: 'overdue-invoice-status',
    name: 'Actualizar Estado Facturas Vencidas',
    description: 'Cambia a "vencida" las facturas emitidas cuya fecha de vencimiento ya pasó',
    schedule: '0 6 * * *',         // todos los días a las 6:00 AM
    scheduleLabel: 'Diario 06:00 AM',
    enabled: true,
  },
];

// ─── Lógica de cada job ───────────────────────────────────────────────────────

// Helper: obtiene los IDs de todos los superadmins/develop para notificarlos
async function getSuperAdminIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { role: { in: ['develop', 'superadmin'] as any }, status: 'activo' },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

// Helper: crea notificación evitando duplicados del mismo día para el mismo usuario+metadata key
async function createIfNotDuplicated(
  userId: string,
  data: Parameters<typeof prisma.notification.create>[0]['data'],
  dedupeKey: string,
  dedupeValue: string,
) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      metadata: { path: [dedupeKey], equals: dedupeValue },
      createdAt: { gte: today },
    },
  });
  if (existing) return false;
  await prisma.notification.create({ data });
  return true;
}

async function runLotDailyNotifications(): Promise<string> {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const activeLots = await prisma.lot.findMany({
    where: { status: 'activo' },
    select: {
      id: true, code: true, startDate: true, durationDays: true,
      createdBy: true, birdsAlive: true,
    },
  });

  if (activeLots.length === 0) return '0 lote(s) activo(s), sin notificaciones';

  const superAdmins = await getSuperAdminIds();
  let created = 0;

  for (const lot of activeLots) {
    const diaActual = Math.floor((today.getTime() - lot.startDate.getTime()) / 86400000) + 1;
    const diasRestantes = lot.durationDays - diaActual;

    // Destinatarios: responsable del lote + superadmins (sin duplicar)
    const recipientIds = [...new Set([lot.createdBy, ...superAdmins].filter(Boolean))] as string[];

    // ── Definir qué notificaciones aplican según el día del ciclo ──────────────
    const notifs: Array<{
      title: string; message: string; type: string;
      priority: string; dedupeKey: string;
    }> = [];

    // Tarea diaria fija — siempre
    notifs.push({
      title: `Día ${diaActual} del ciclo — ${lot.code}`,
      message: `Recuerda registrar el diario: temperatura, mortalidad y alimento consumido. Lote con ${lot.birdsAlive} pollos vivos.`,
      type: 'task', priority: 'low',
      dedupeKey: `lot_day_${lot.id}`, // incluye lotId + día
    });

    // Día 1 — bienvenida al ciclo
    if (diaActual === 1) {
      notifs.push({
        title: `Ciclo iniciado — ${lot.code}`,
        message: 'Revisa temperatura del galpón (32-33°C), verifica agua y alimento, observa comportamiento de los pollitos.',
        type: 'info', priority: 'medium',
        dedupeKey: `lot_start_${lot.id}`,
      });
    }

    // Día 7 — pesaje semanal
    if (diaActual === 7) {
      notifs.push({
        title: `Pesaje semanal — ${lot.code}`,
        message: 'Hoy es el primer pesaje semanal. Pesa 5 pollos representativos y registra los resultados.',
        type: 'alert', priority: 'high',
        dedupeKey: `lot_weight_7_${lot.id}`,
      });
    }

    // Día 14 — vacunación
    if (diaActual === 14) {
      notifs.push({
        title: `Vacunación programada — ${lot.code}`,
        message: 'Día de vacunación. Aplica las vacunas correspondientes y registra el lote de vacunas usado.',
        type: 'alert', priority: 'high',
        dedupeKey: `lot_vaccine_14_${lot.id}`,
      });
    }

    // Días 14, 21, 28, 35 — pesaje semanal recurrente
    if (diaActual > 7 && diaActual % 7 === 0) {
      notifs.push({
        title: `Pesaje semana ${Math.floor(diaActual / 7)} — ${lot.code}`,
        message: `Pesa 5 pollos y registra los pesos. Día ${diaActual} de ${lot.durationDays}.`,
        type: 'alert', priority: 'medium',
        dedupeKey: `lot_weight_${diaActual}_${lot.id}`,
      });
    }

    // Día 22 — cambio a alimento finalizador
    if (diaActual === 22) {
      notifs.push({
        title: `Cambiar a alimento finalizador — ${lot.code}`,
        message: 'Usa el sobrante de iniciador 50/50 durante 3 días y luego cambia completamente al finalizador.',
        type: 'alert', priority: 'high',
        dedupeKey: `lot_feed_change_${lot.id}`,
      });
    }

    // 7 días antes del sacrificio
    if (diasRestantes === 7) {
      notifs.push({
        title: `7 días para el sacrificio — ${lot.code}`,
        message: 'Prepara la fase final. Contacta clientes, confirma fecha de sacrificio y coordina transporte.',
        type: 'alert', priority: 'high',
        dedupeKey: `lot_harvest_7_${lot.id}`,
      });
    }

    // Día de sacrificio
    if (diaActual >= lot.durationDays) {
      notifs.push({
        title: `Ciclo completado — ${lot.code}`,
        message: `El lote ${lot.code} ha completado sus ${lot.durationDays} días. Procede con el sacrificio y el reporte final.`,
        type: 'alert', priority: 'high',
        dedupeKey: `lot_harvest_day_${lot.id}`,
      });
    }

    // ── Crear notificaciones para cada destinatario ─────────────────────────
    for (const notif of notifs) {
      for (const userId of recipientIds) {
        const ok = await createIfNotDuplicated(
          userId,
          {
            userId,
            module: 'pilot',
            type: notif.type as any,
            priority: notif.priority as any,
            title: notif.title,
            message: notif.message,
            href: '/dashboard/pilot',
            metadata: {
              [notif.dedupeKey.split('_')[0] + 'Key']: notif.dedupeKey,
              lotId: lot.id, lotCode: lot.code, diaActual,
            },
          },
          notif.dedupeKey.split('_')[0] + 'Key',
          notif.dedupeKey,
        );
        if (ok) created++;
      }
    }
  }

  return `${created} notificacion(es) de lote generada(s)`;
}

async function runCollectionAlerts(): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  const candidates = await prisma.invoice.findMany({
    where: {
      status: { in: ['emitida', 'vencida'] },
      dueDate: { lte: twoDaysFromNow },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      lot: { select: { code: true, createdBy: true } },
    },
  });

  const invoices = candidates.filter((i) => i.paidAmount < i.subtotal);

  const superAdmins = await getSuperAdminIds();
  let created = 0;

  for (const invoice of invoices) {
    if (!invoice.lot?.createdBy) continue;

    const pendingAmount = invoice.subtotal - invoice.paidAmount;
    const isOverdue = invoice.dueDate && invoice.dueDate < today;
    const daysOverdueVal = isOverdue && invoice.dueDate
      ? Math.floor((today.getTime() - invoice.dueDate.getTime()) / 86400000)
      : 0;

    // Destinatarios: responsable del lote + superadmins (sin duplicar)
    const recipientIds = [...new Set([invoice.lot.createdBy, ...superAdmins])] as string[];

    const notifData = {
      module: 'collections' as const,
      type: 'collection_due' as const,
      priority: (isOverdue ? 'high' : 'medium') as 'high' | 'medium',
      title: isOverdue
        ? `Cobro vencido — ${invoice.customer.name}`
        : `Cobro próximo a vencer — ${invoice.customer.name}`,
      message: isOverdue
        ? `Factura #${invoice.number} de ${invoice.customer.name} venció hace ${daysOverdueVal} día(s). Pendiente: $${pendingAmount.toLocaleString('es-CO')}`
        : `Factura #${invoice.number} de ${invoice.customer.name} vence en 2 días. Pendiente: $${pendingAmount.toLocaleString('es-CO')}`,
      href: '/dashboard/collections',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        customerId: invoice.customerId,
        customerName: invoice.customer.name,
        pendingAmount,
        daysOverdue: daysOverdueVal,
      },
    };

    for (const userId of recipientIds) {
      const ok = await createIfNotDuplicated(
        userId,
        { userId, ...notifData },
        'invoiceId',
        invoice.id,
      );
      if (ok) created++;
    }
  }

  return `${created} alerta(s) de cobro generada(s)`;
}

async function runOverdueInvoiceStatus(): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await prisma.invoice.updateMany({
    where: {
      status: 'emitida',
      dueDate: { lt: today },
      paidAmount: 0,
    },
    data: { status: 'vencida' },
  });

  return `${count} factura(s) marcada(s) como vencida`;
}

// Mapa de ejecutores por id
const JOB_RUNNERS: Record<string, () => Promise<string>> = {
  'lot-daily-notifications': runLotDailyNotifications,
  'collection-alerts':       runCollectionAlerts,
  'overdue-invoice-status':  runOverdueInvoiceStatus,
};

// ─── Registro de historial en memoria (los últimos 20 por job) ────────────────
const runHistory: Record<string, Array<{ at: Date; result: string; ok: boolean }>> = {};

function recordHistory(jobId: string, result: string, ok: boolean) {
  if (!runHistory[jobId]) runHistory[jobId] = [];
  runHistory[jobId].unshift({ at: new Date(), result, ok });
  if (runHistory[jobId].length > 20) runHistory[jobId].pop();

  const job = CRON_JOBS.find((j) => j.id === jobId);
  if (job) {
    job.lastRun = new Date();
    job.lastResult = result;
  }
}

export function getJobHistory(jobId?: string) {
  if (jobId) return runHistory[jobId] ?? [];
  return runHistory;
}

// ─── Ejecución manual (desde controller admin) ────────────────────────────────
export async function runJobManually(jobId: string): Promise<{ ok: boolean; result: string }> {
  const runner = JOB_RUNNERS[jobId];
  if (!runner) return { ok: false, result: `Job "${jobId}" no encontrado` };

  try {
    const result = await runner();
    recordHistory(jobId, result, true);
    return { ok: true, result };
  } catch (err: any) {
    const msg = err?.message ?? 'Error desconocido';
    recordHistory(jobId, msg, false);
    return { ok: false, result: msg };
  }
}

// ─── Inicialización de todos los cron jobs ────────────────────────────────────
export function initCronJobs() {
  for (const jobDef of CRON_JOBS) {
    if (!jobDef.enabled) continue;
    const runner = JOB_RUNNERS[jobDef.id];
    if (!runner) continue;

    cron.schedule(jobDef.schedule, async () => {
      console.log(`[CRON] Ejecutando: ${jobDef.name}`);
      try {
        const result = await runner();
        recordHistory(jobDef.id, result, true);
        console.log(`[CRON] ✅ ${jobDef.name}: ${result}`);
      } catch (err: any) {
        const msg = err?.message ?? 'Error desconocido';
        recordHistory(jobDef.id, msg, false);
        console.error(`[CRON] ❌ ${jobDef.name}: ${msg}`);
      }
    }, {
      timezone: 'America/Bogota',
    });

    console.log(`[CRON] Registrado: ${jobDef.name} (${jobDef.scheduleLabel})`);
  }
}
