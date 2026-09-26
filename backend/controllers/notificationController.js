import Notification from '../models/Notification.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response.js';

/**
 * Get user notifications
 * GET /api/notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, read } = req.query;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));

    // Build query - use _id from req.user
    const userId = req.user._id || req.user.id;
    const query = { recipient: userId };
    if (read !== undefined) {
      query.read = read === 'true';
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    // Get total count
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(userId);

    return successResponse(res, {
      notifications,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Notifications fetched successfully');
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return errorResponse(res, 'Failed to fetch notifications', 'FETCH_ERROR', 500);
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread/count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!req.user || !userId) {
      return errorResponse(res, 'User not authenticated', 'AUTH_ERROR', 401);
    }
    
    const unreadCount = await Notification.getUnreadCount(userId);
    return successResponse(res, { unreadCount }, 'Unread count fetched successfully');
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return errorResponse(res, 'Failed to fetch unread count', 'FETCH_ERROR', 500);
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:notificationId/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id || req.user.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return notFoundResponse(res, 'Notification not found');
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== userId.toString()) {
      return errorResponse(res, 'Unauthorized', 'UNAUTHORIZED', 403);
    }

    notification.markAsRead();
    await notification.save();

    return successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return errorResponse(res, 'Failed to mark notification as read', 'UPDATE_ERROR', 500);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read/all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Notification.markAllAsRead(userId);
    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return errorResponse(res, 'Failed to mark all notifications as read', 'UPDATE_ERROR', 500);
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:notificationId
 */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id || req.user.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return notFoundResponse(res, 'Notification not found');
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== userId.toString()) {
      return errorResponse(res, 'Unauthorized', 'UNAUTHORIZED', 403);
    }

    await Notification.findByIdAndDelete(notificationId);
    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    console.error('Error deleting notification:', error);
    return errorResponse(res, 'Failed to delete notification', 'DELETE_ERROR', 500);
  }
};

/**
 * Delete all notifications
 * DELETE /api/notifications
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Notification.deleteMany({ recipient: userId });
    return successResponse(res, null, 'All notifications deleted successfully');
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return errorResponse(res, 'Failed to delete all notifications', 'DELETE_ERROR', 500);
  }
};

/**
 * Create notification (internal use)
 */
export const createNotification = async (recipientId, type, title, message, data = {}) => {
  try {
    const notification = await Notification.createNotification(
      recipientId,
      type,
      title,
      message,
      data
    );
    return notification;
  } catch (error) {
    //console.error('Error creating notification:', error);
    throw error;
  }
};
