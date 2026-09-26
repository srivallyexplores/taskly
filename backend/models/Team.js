import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  permissions: {
    canManageMembers: { type: Boolean, default: false },
    canManageProjects: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false },
    canDeleteTeam: { type: Boolean, default: false }
  }
});

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [teamMemberSchema],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  settings: {
    allowMemberInvites: { type: Boolean, default: true },
    requireApprovalForJoin: { type: Boolean, default: false },
    defaultMemberRole: { type: String, enum: ['member', 'admin'], default: 'member' },
    maxMembers: { type: Number, default: 50 }
  },
  avatar: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
// Indexes for query performance
// Note: inviteCode already has unique index from schema definition
teamSchema.index({ owner: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ name: 1, owner: 1 });

// Virtual for member count
teamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for project count
teamSchema.virtual('projectCount').get(function() {
  return this.projects ? this.projects.length : 0;
});

// Method to check if user is member
teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to get user role in team
teamSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Method to check if user has permission
teamSchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  if (!member) return false;
  
  // Owner and admin have all permissions
  if (member.role === 'owner') return true;
  if (member.role === 'admin') {
    const adminPermissions = ['canManageMembers', 'canManageProjects', 'canManageSettings'];
    return adminPermissions.includes(permission);
  }
  
  return member.permissions[permission] || false;
};

// Method to add member
teamSchema.methods.addMember = function(userId, role = 'member') {
  if (this.isMember(userId)) {
    throw new Error('User is already a member');
  }
  
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Team has reached maximum member limit');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });
  
  return this;
};

// Method to remove member
teamSchema.methods.removeMember = function(userId) {
  if (this.owner.toString() === userId.toString()) {
    throw new Error('Cannot remove team owner');
  }
  
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
  return this;
};

// Method to update member role
teamSchema.methods.updateMemberRole = function(userId, newRole) {
  if (this.owner.toString() === userId.toString() && newRole !== 'owner') {
    throw new Error('Cannot change owner role');
  }
  
  const member = this.members.find(member => member.user.toString() === userId.toString());
  if (!member) {
    throw new Error('Member not found');
  }
  
  member.role = newRole;
  return this;
};

// Pre-save middleware to update permissions based on role
teamSchema.pre('save', function(next) {
  this.members.forEach(member => {
    if (member.role === 'owner') {
      member.permissions = {
        canManageMembers: true,
        canManageProjects: true,
        canManageSettings: true,
        canDeleteTeam: true
      };
    } else if (member.role === 'admin') {
      member.permissions = {
        canManageMembers: true,
        canManageProjects: true,
        canManageSettings: true,
        canDeleteTeam: false
      };
    } else {
      member.permissions = {
        canManageMembers: false,
        canManageProjects: false,
        canManageSettings: false,
        canDeleteTeam: false
      };
    }
  });
  
  this.updatedAt = new Date();
  next();
});

// Static method to find teams by user
teamSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  });
};

// Static method to find public teams
teamSchema.statics.findPublic = function() {
  return this.find({ isPrivate: false });
};

const Team = mongoose.model('Team', teamSchema);
export default Team;