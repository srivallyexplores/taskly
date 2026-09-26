/**
 * Permission checking utilities for teams and projects
 */

/**
 * Check if user is team owner
 * @param {Object} team - Team document
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
export const isTeamOwner = (team, userId) => {
  if (!team || !userId) return false;
  const ownerId = team.owner?._id || team.owner;
  return ownerId.toString() === userId.toString();
};

/**
 * Check if user is team admin
 * @param {Object} team - Team document
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
export const isTeamAdmin = (team, userId) => {
  if (!team || !userId) return false;
  const member = team.members?.find(m => {
    const memberId = m.user?._id || m.user?.id || m.user;
    return memberId.toString() === userId.toString();
  });
  return member?.role === 'admin';
};

/**
 * Check if user is team member
 * @param {Object} team - Team document
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
export const isTeamMember = (team, userId) => {
  if (!team || !userId) return false;
  return team.members?.some(m => {
    const memberId = m.user?._id || m.user?.id || m.user;
    return memberId.toString() === userId.toString();
  });
};

/**
 * Get user's role in team
 * @param {Object} team - Team document
 * @param {string} userId - User ID
 * @returns {string|null} - Role or null if not a member
 */
export const getTeamUserRole = (team, userId) => {
  if (!team || !userId) return null;
  
  // Check if owner
  if (isTeamOwner(team, userId)) return 'owner';
  
  // Check members
  const member = team.members?.find(m => {
    const memberId = m.user?._id || m.user?.id || m.user;
    return memberId.toString() === userId.toString();
  });
  
  return member?.role || null;
};

/**
 * Check if user can manage team
 * @param {Object} team - Team document
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canManageTeam = (team, userId) => {
  if (!team || !userId) return false;
  return isTeamOwner(team, userId) || isTeamAdmin(team, userId);
};

/**
 * Check if user can manage team members
 * @param {Object} team - Team document
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canManageTeamMembers = (team, userId) => {
  return canManageTeam(team, userId);
};

/**
 * Check if user is project owner
 * @param {Object} project - Project document
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
export const isProjectOwner = (project, userId) => {
  if (!project || !userId) return false;
  const ownerId = project.owner?._id || project.owner?.id || project.owner;
  return ownerId.toString() === userId.toString();
};

/**
 * Check if user is project manager
 * @param {Object} project - Project document
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
export const isProjectManager = (project, userId) => {
  if (!project || !userId) return false;
  const member = project.members?.find(m => {
    const memberId = m.user?._id || m.user?.id || m.user;
    return memberId.toString() === userId.toString();
  });
  return member?.role === 'manager';
};

/**
 * Check if user is project member
 * @param {Object} project - Project document
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
export const isProjectMember = (project, userId) => {
  if (!project || !userId) return false;
  return project.members?.some(m => {
    const memberId = m.user?._id || m.user?.id || m.user;
    return memberId.toString() === userId.toString();
  });
};

/**
 * Get user's role in project
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {string|null} - Role or null if not a member
 */
export const getProjectUserRole = (project, userId) => {
  if (!project || !userId) return null;
  
  // Check if owner
  if (isProjectOwner(project, userId)) return 'owner';
  
  // Check members
  const member = project.members?.find(m => {
    const memberId = m.user?._id || m.user?.id || m.user;
    return memberId.toString() === userId.toString();
  });
  
  return member?.role || null;
};

/**
 * Check if user can manage project
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canManageProject = (project, userId) => {
  if (!project || !userId) return false;
  return isProjectOwner(project, userId) || isProjectManager(project, userId);
};

/**
 * Check if user can manage project members
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canManageProjectMembers = (project, userId) => {
  return canManageProject(project, userId);
};

/**
 * Check if user can edit project
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canEditProject = (project, userId) => {
  return canManageProject(project, userId);
};

/**
 * Check if user can delete project
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canDeleteProject = (project, userId) => {
  return isProjectOwner(project, userId);
};

/**
 * Check if user can create tasks in project
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canCreateProjectTasks = (project, userId) => {
  if (!project || !userId) return false;
  const role = getProjectUserRole(project, userId);
  return role === 'owner' || role === 'manager' || role === 'contributor';
};

/**
 * Check if user can manage tasks in project
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canManageProjectTasks = (project, userId) => {
  if (!project || !userId) return false;
  const role = getProjectUserRole(project, userId);
  return role === 'owner' || role === 'manager' || role === 'contributor';
};

/**
 * Validate user has permission for action
 * @param {Object} team - Team document
 * @param {string} userId - User ID
 * @param {string} action - Action to check (e.g., 'manage_members', 'manage_projects')
 * @returns {boolean}
 */
export const validateTeamPermission = (team, userId, action) => {
  if (!team || !userId) return false;
  
  const role = getTeamUserRole(team, userId);
  
  // Owner has all permissions
  if (role === 'owner') return true;
  
  // Admin permissions
  if (role === 'admin') {
    const adminActions = ['manage_members', 'manage_projects', 'manage_settings', 'invite_members'];
    return adminActions.includes(action);
  }
  
  // Member permissions
  if (role === 'member') {
    const memberActions = ['view_team', 'create_projects', 'view_team_members'];
    return memberActions.includes(action);
  }
  
  return false;
};

/**
 * Validate user has permission for project action
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @param {string} action - Action to check (e.g., 'manage_tasks', 'manage_members')
 * @returns {boolean}
 */
export const validateProjectPermission = (project, userId, action) => {
  if (!project || !userId) return false;
  
  const role = getProjectUserRole(project, userId);
  
  // Owner has all permissions
  if (role === 'owner') return true;
  
  // Manager permissions
  if (role === 'manager') {
    const managerActions = ['manage_tasks', 'manage_members', 'edit_project', 'view_project'];
    return managerActions.includes(action);
  }
  
  // Contributor permissions
  if (role === 'contributor') {
    const contributorActions = ['manage_tasks', 'view_project', 'add_comments'];
    return contributorActions.includes(action);
  }
  
  // Viewer permissions
  if (role === 'viewer') {
    const viewerActions = ['view_project'];
    return viewerActions.includes(action);
  }
  
  return false;
};

export default {
  isTeamOwner,
  isTeamAdmin,
  isTeamMember,
  getTeamUserRole,
  canManageTeam,
  canManageTeamMembers,
  isProjectOwner,
  isProjectManager,
  isProjectMember,
  getProjectUserRole,
  canManageProject,
  canManageProjectMembers,
  canEditProject,
  canDeleteProject,
  canCreateProjectTasks,
  canManageProjectTasks,
  validateTeamPermission,
  validateProjectPermission
};
