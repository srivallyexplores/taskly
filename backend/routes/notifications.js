import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

// GET /api/notifications - Get user notifications
router.get('/', auth, getUserNotifications);

// GET /api/notifications/unread/count - Get unread count
router.get('/unread/count', auth, getUnreadCount);

// PUT /api/notifications/:notificationId/read - Mark as read
router.put('/:notificationId/read', auth, markAsRead);

// PUT /api/notifications/read/all - Mark all as read
router.put('/read/all', auth, markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', auth, deleteNotification);

// DELETE /api/notifications - Delete all notifications
router.delete('/', auth, deleteAllNotifications);

export default router;
