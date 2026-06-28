// src/routes/admin.routes.ts
import { Router } from 'express';
import { listCronJobs, triggerCronJob, getCronJobHistory } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/cron', listCronJobs);
router.post('/cron/:jobId/run', triggerCronJob);
router.get('/cron/:jobId/history', getCronJobHistory);

export default router;
