// src/routes/inventory.routes.ts
import { Router } from 'express';
import { listInventory, registerPurchase, createReservation, getInventorySummary } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', listInventory);
router.get('/summary', getInventorySummary);
router.post('/purchases', registerPurchase);
router.post('/reservations', createReservation);

export default router;
