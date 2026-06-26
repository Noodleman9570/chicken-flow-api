// src/routes/reports.routes.ts
import { Router } from 'express';
import { listReports, generateReport, downloadReport, scheduleReport } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', listReports);
router.post('/generate', generateReport);
router.post('/schedules', scheduleReport);
router.get('/:id/download', downloadReport);

export default router;
