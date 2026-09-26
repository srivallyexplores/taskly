import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'invitation_received',
      'invitation_accepted',
      'invitation_denied',
      'member_added',
      'member_removed',
      'task_assigned',
      'task_completed',
      'project_created',
      'project_updated',
      'team_updated'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for checking if notification is new
notificationSchema.virtual('isNew').get(function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.createdAt > oneHourAgo && !this.read;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(recipientId, type, title, message, data = {}) {
  try {
    const notification = new this({
      recipient: recipientId,
      type,
      title,
      message,
      data
    });
    await notification.save();
    return notification;
  } catch (error) {
    //console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    read: false
  });
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, limit = 20, skip = 0) {
  return this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
