// src/routes/payments.routes.ts
import { Router } from 'express';
import { listPayments, createPayment, getPaymentsSummary, sendPaymentReminder } from '../controllers/payments.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', listPayments);
router.get('/summary', getPaymentsSummary);
router.post('/', createPayment);
router.post('/:id/reminder', sendPaymentReminder);

export default router;
