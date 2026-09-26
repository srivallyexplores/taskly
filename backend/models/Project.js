import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['manager', 'contributor', 'viewer'],
    default: 'contributor'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  permissions: {
    canManageTasks: { type: Boolean, default: false },
    canManageMembers: { type: Boolean, default: false },
    canEditProject: { type: Boolean, default: false },
    canDeleteProject: { type: Boolean, default: false }
  }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [projectMemberSchema],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  budget: {
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPublic: { type: Boolean, default: false },
    allowTaskCreation: { type: Boolean, default: true },
    requireTaskApproval: { type: Boolean, default: false },
    autoAssignTasks: { type: Boolean, default: false }
  },
  milestones: [{
    name: { type: String, required: true },
    description: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    completedAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  archivedAt: {
    type: Date,
    default: null
  },
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
projectSchema.index({ team: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });

// Virtual for member count
projectSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for task count
projectSchema.virtual('taskCount').get(function() {
  return this.tasks ? this.tasks.length : 0;
});

// Virtual for progress calculation
projectSchema.virtual('progress').get(function() {
  if (!this.tasks || this.tasks.length === 0) return 0;
  // This would need to be populated with actual task data
  return 0; // Placeholder
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const today = new Date();
  const endDate = new Date(this.endDate);
  const timeDiff = endDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for is overdue
projectSchema.virtual('isOverdue').get(function() {
  if (!this.endDate || this.status === 'completed') return false;
  return new Date() > new Date(this.endDate);
});

// Method to check if user is member
projectSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to get user role in project
projectSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Method to check if user has permission
projectSchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  if (!member) return false;
  
  // Project owner has all permissions
  if (this.owner.toString() === userId.toString()) return true;
  
  // Manager has most permissions
  if (member.role === 'manager') {
    const managerPermissions = ['canManageTasks', 'canManageMembers', 'canEditProject'];
    return managerPermissions.includes(permission);
  }
  
  // Contributor has limited permissions
  if (member.role === 'contributor') {
    return permission === 'canManageTasks';
  }
  
  // Viewer has no management permissions
  return false;
};

// Method to add member
projectSchema.methods.addMember = function(userId, role = 'contributor') {
  if (this.isMember(userId)) {
    throw new Error('User is already a member');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });
  
  return this;
};

// Method to remove member
projectSchema.methods.removeMember = function(userId) {
  if (this.owner.toString() === userId.toString()) {
    throw new Error('Cannot remove project owner');
  }
  
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
  return this;
};

// Method to update member role
projectSchema.methods.updateMemberRole = function(userId, newRole) {
  if (this.owner.toString() === userId.toString()) {
    throw new Error('Cannot change project owner role');
  }
  
  const member = this.members.find(member => member.user.toString() === userId.toString());
  if (!member) {
    throw new Error('Member not found');
  }
  
  member.role = newRole;
  return this;
};

// Method to add milestone
projectSchema.methods.addMilestone = function(milestoneData) {
  this.milestones.push({
    ...milestoneData,
    createdAt: new Date()
  });
  return this;
};

// Method to update milestone status
projectSchema.methods.updateMilestoneStatus = function(milestoneId, status) {
  const milestone = this.milestones.id(milestoneId);
  if (!milestone) {
    throw new Error('Milestone not found');
  }
  
  milestone.status = status;
  if (status === 'completed') {
    milestone.completedAt = new Date();
  }
  
  return this;
};

// Pre-save middleware to update permissions based on role
projectSchema.pre('save', function(next) {
  this.members.forEach(member => {
    if (member.role === 'manager') {
      member.permissions = {
        canManageTasks: true,
        canManageMembers: true,
        canEditProject: true,
        canDeleteProject: false
      };
    } else if (member.role === 'contributor') {
      member.permissions = {
        canManageTasks: true,
        canManageMembers: false,
        canEditProject: false,
        canDeleteProject: false
      };
    } else { // viewer
      member.permissions = {
        canManageTasks: false,
        canManageMembers: false,
        canEditProject: false,
        canDeleteProject: false
      };
    }
  });
  
  this.updatedAt = new Date();
  next();
});

// Static method to find projects by user
projectSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  });
};

// Static method to find projects by team
projectSchema.statics.findByTeam = function(teamId) {
  return this.find({ team: teamId });
};

// Static method to find active projects
projectSchema.statics.findActive = function() {
  return this.find({ 
    status: { $in: ['planning', 'active'] },
    archivedAt: null 
  });
};

// Static method to find overdue projects
projectSchema.statics.findOverdue = function() {
  return this.find({
    endDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] },
    archivedAt: null
  });
};

const Project = mongoose.model('Project', projectSchema);
export default Project;