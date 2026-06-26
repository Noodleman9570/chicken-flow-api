// src/routes/users.routes.ts
import { Router } from 'express';
import { listUsers, inviteUser, updateUser, updateUserStatus, listPermissions } from '../controllers/users.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getProfile } from '../controllers/auth.controller';

const router = Router();
router.use(authenticate);

router.get('/profile', getProfile);
router.get('/', requireRole('admin'), listUsers);
router.post('/invite', requireRole('admin'), inviteUser);
router.put('/:id', requireRole('admin'), updateUser);
router.patch('/:id/status', requireRole('admin'), updateUserStatus);

export default router;
