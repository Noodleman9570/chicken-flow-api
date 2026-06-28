// src/routes/notifications.routes.ts
import { Router } from 'express';
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  generateCollectionAlerts,
  deleteNotification,
} from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.put('/read-all', markAllAsRead);
router.post('/', createNotification);
router.post('/system/collection-alerts', generateCollectionAlerts);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
