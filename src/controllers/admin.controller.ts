// src/controllers/admin.controller.ts
// Panel de administración del sistema — solo rol 'develop'

import { Request, Response } from 'express';
import { CRON_JOBS, runJobManually, getJobHistory } from '../utils/cron';
import { sendSuccess, sendError, sendServerError } from '../utils/response';

// GET /api/v1/admin/cron — Listar todos los jobs con estado
export async function listCronJobs(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'develop') {
      sendError(res, 'Acceso exclusivo para super administradores', 'FORBIDDEN', 403);
      return;
    }

    const jobs = CRON_JOBS.map((job) => ({
      ...job,
      history: getJobHistory(job.id),
    }));

    sendSuccess(res, jobs);
  } catch (err) {
    sendServerError(res, err);
  }
}

// POST /api/v1/admin/cron/:jobId/run — Ejecutar job manualmente
export async function triggerCronJob(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'develop') {
      sendError(res, 'Acceso exclusivo para super administradores', 'FORBIDDEN', 403);
      return;
    }

    const jobId = String(req.params.jobId);
    const job = CRON_JOBS.find((j) => j.id === jobId);

    if (!job) {
      sendError(res, `Job "${jobId}" no existe`, 'NOT_FOUND', 404);
      return;
    }

    const { ok, result } = await runJobManually(jobId);

    if (ok) {
      sendSuccess(res, { jobId, result, ranAt: new Date() }, result);
    } else {
      sendError(res, result, 'JOB_ERROR', 500);
    }
  } catch (err) {
    sendServerError(res, err);
  }
}

// GET /api/v1/admin/cron/:jobId/history — Historial de ejecuciones de un job
export async function getCronJobHistory(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'develop') {
      sendError(res, 'Acceso exclusivo para super administradores', 'FORBIDDEN', 403);
      return;
    }

    const jobId = String(req.params.jobId);
    const history = getJobHistory(jobId);

    sendSuccess(res, { jobId, history });
  } catch (err) {
    sendServerError(res, err);
  }
}
