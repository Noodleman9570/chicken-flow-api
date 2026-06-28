// src/routes/pilot.routes.ts
// Módulo 03 Piloto + endpoints clásicos de endpoints-avicola.md
import { Router } from 'express';
import {
  listLots, getLot, createLot, updateLot, closeLot,
  listDailyRecords, createDailyRecord, updateDailyRecord, deleteDailyRecord,
  listWeeklyRecords, createWeeklyRecord, deleteWeeklyRecord,
  getLotSummary, getFinalReport,
  calcularAlimento, calcularViabilidad,
} from '../controllers/pilot.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Lotes
router.get('/lots', listLots);
router.get('/lots/:id', getLot);
router.post('/lots', createLot);
router.put('/lots/:id', updateLot);
router.patch('/lots/:id/close', closeLot);

// Registros diarios
router.get('/lots/:id/daily-records', listDailyRecords);
router.post('/lots/:id/daily-records', createDailyRecord);
router.put('/daily-records/:recordId', updateDailyRecord);
router.delete('/daily-records/:recordId', deleteDailyRecord);

// Registros semanales
router.get('/lots/:id/weekly-records', listWeeklyRecords);
router.post('/lots/:id/weekly-records', createWeeklyRecord);
router.delete('/weekly-records/:recordId', deleteWeeklyRecord);

// Resumen y reporte final
router.get('/lots/:id/summary', getLotSummary);
router.get('/lots/:id/final-report', getFinalReport);

// Cálculos de utilidad
router.get('/calculos/alimento/:cantidadPollitos', calcularAlimento);
router.post('/calculos/viabilidad', calcularViabilidad);

export default router;
