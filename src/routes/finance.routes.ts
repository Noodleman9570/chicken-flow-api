// src/routes/finance.routes.ts
import { Router } from 'express';
import { listDistributions, closePeriod, getFinanceSummary, getProjections } from '../controllers/finance.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/distributions', listDistributions);
router.get('/summary', getFinanceSummary);
router.get('/projections', getProjections);
router.post('/close-period', requireRole('admin'), closePeriod);

export default router;
