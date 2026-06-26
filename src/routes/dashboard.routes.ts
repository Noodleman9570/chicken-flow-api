// src/routes/dashboard.routes.ts
import { Router } from 'express';
import { getDashboardSummary, getQuickModules } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/quick-modules', getQuickModules);

export default router;
