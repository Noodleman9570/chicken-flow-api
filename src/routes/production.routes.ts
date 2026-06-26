// src/routes/production.routes.ts
import { Router } from 'express';
import { listProductionRecords, createProductionRecord, updateProductionRecord, getProductionSummary } from '../controllers/production.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/daily-records', listProductionRecords);
router.post('/daily-records', createProductionRecord);
router.put('/daily-records/:id', updateProductionRecord);
router.get('/summary', getProductionSummary);

export default router;
