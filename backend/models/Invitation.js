import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  message: {
    type: String,
    maxlength: 500,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'denied', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes for optimal query performance
invitationSchema.index({ invitee: 1, status: 1 });
invitationSchema.index({ team: 1, status: 1 });
invitationSchema.index({ inviter: 1, createdAt: -1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for checking if invitation is expired
invitationSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && new Date() > this.expiresAt;
});

// Method to accept invitation
invitationSchema.methods.accept = function() {
  if (this.status !== 'pending') {
    throw new Error('Can only accept pending invitations');
  }
  
  if (this.isExpired) {
    throw new Error('Invitation has expired');
  }
  
  this.status = 'accepted';
  this.respondedAt = new Date();
  return this;
};

// Method to deny invitation
invitationSchema.methods.deny = function() {
  if (this.status !== 'pending') {
    throw new Error('Can only deny pending invitations');
  }
  
  this.status = 'denied';
  this.respondedAt = new Date();
  return this;
};

// Method to cancel invitation
invitationSchema.methods.cancel = function() {
  if (this.status !== 'pending') {
    throw new Error('Can only cancel pending invitations');
  }
  
  this.status = 'cancelled';
  this.respondedAt = new Date();
  return this;
};

// Static method to find pending invitations for user
invitationSchema.statics.findPendingForUser = function(userId) {
  return this.find({
    invitee: userId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('team', 'name description avatar').populate('inviter', 'fullname username avatar');
};

// Static method to find pending invitations for team
invitationSchema.statics.findPendingForTeam = function(teamId) {
  return this.find({
    team: teamId,
    status: 'pending'
  }).populate('invitee', 'fullname username email avatar').populate('inviter', 'fullname username');
};

// Static method to check if invitation exists
invitationSchema.statics.findExisting = function(teamId, inviteeId) {
  return this.findOne({
    team: teamId,
    invitee: inviteeId,
    status: 'pending'
  });
};

// Static method to get invitation history for team
invitationSchema.statics.findHistoryForTeam = function(teamId, limit = 50, skip = 0) {
  return this.find({ team: teamId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('invitee', 'fullname username email avatar')
    .populate('inviter', 'fullname username avatar');
};

// Pre-save middleware to validate expiration
invitationSchema.pre('save', function(next) {
  if (this.status !== 'pending' && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  next();
});

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
