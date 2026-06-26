// src/routes/farms.routes.ts
import { Router } from 'express';
import { listFarms, getFarm, createFarm, updateFarm, getFarmOptions } from '../controllers/farms.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', listFarms);
router.get('/options', getFarmOptions);
router.get('/:id', getFarm);
router.post('/', requireRole('admin'), createFarm);
router.put('/:id', requireRole('admin'), updateFarm);

export default router;
