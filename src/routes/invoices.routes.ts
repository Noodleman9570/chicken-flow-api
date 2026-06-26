// src/routes/invoices.routes.ts
import { Router } from 'express';
import { listInvoices, createInvoice, updateInvoiceStatus, getInvoicePdf } from '../controllers/invoices.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', listInvoices);
router.post('/', createInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.get('/:id/pdf', getInvoicePdf);

export default router;
