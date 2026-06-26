// src/routes/customers.routes.ts
import { Router } from 'express';
import { listCustomers, getCustomer, createCustomer, updateCustomer, getCustomerOptions, getCustomerStatement } from '../controllers/customers.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', listCustomers);
router.get('/options', getCustomerOptions);
router.get('/:id', getCustomer);
router.get('/:id/statement', getCustomerStatement);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

export default router;
