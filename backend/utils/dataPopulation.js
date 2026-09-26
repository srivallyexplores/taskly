/**
 * Data population utilities for consistent data retrieval
 * Ensures all related data is properly populated with error handling
 */

/**
 * Safely populate team data
 * @param {Object} team - Team document
 * @returns {Promise<Object>} - Populated team
 */
export const populateTeamData = async (team) => {
  if (!team) return null;
  
  try {
    await team.populate('owner', 'fullname username email avatar');
    await team.populate('members.user', 'fullname username email avatar lastActive');
    await team.populate('projects');
    return team;
  } catch (error) {
    //console.error('Error populating team data:', error);
    return team; // Return unpopulated team if population fails
  }
};

/**
 * Safely populate project data
 * @param {Object} project - Project document
 * @returns {Promise<Object>} - Populated project
 */
export const populateProjectData = async (project) => {
  if (!project) return null;
  
  try {
    await project.populate('team', 'name members');
    await project.populate('owner', 'fullname username email avatar');
    await project.populate('members.user', 'fullname username email avatar lastActive');
    await project.populate('tasks');
    return project;
  } catch (error) {
    //console.error('Error populating project data:', error);
    return project; // Return unpopulated project if population fails
  }
};

/**
 * Safely populate team members with error handling
 * @param {Object} team - Team document
 * @returns {Promise<Object>} - Team with populated members
 */
export const populateTeamMembers = async (team) => {
  if (!team || !team.members) return team;
  
  try {
    await team.populate('members.user', 'fullname username email avatar lastActive');
    return team;
  } catch (error) {
    //console.error('Error populating team members:', error);
    return team;
  }
};

/**
 * Safely populate project members with error handling
 * @param {Object} project - Project document
 * @returns {Promise<Object>} - Project with populated members
 */
export const populateProjectMembers = async (project) => {
  if (!project || !project.members) return project;
  
  try {
    await project.populate('members.user', 'fullname username email avatar lastActive');
    return project;
  } catch (error) {
    //console.error('Error populating project members:', error);
    return project;
  }
};

/**
 * Filter out invalid members (those without user data)
 * @param {Array} members - Array of member objects
 * @returns {Array} - Filtered members with valid user data
 */
export const filterValidMembers = (members) => {
  if (!Array.isArray(members)) return [];
  
  return members.filter(member => {
    // Check if member has user data
    if (!member.user) return false;
    
    // Check if user has required fields
    const user = member.user;
    if (typeof user === 'object') {
      return user._id || user.id;
    }
    
    // If user is just an ID string, it's valid
    return !!user;
  });
};

/**
 * Get safe member data with fallbacks
 * @param {Object} member - Member object
 * @returns {Object} - Safe member data
 */
export const getSafeMemberData = (member) => {
  if (!member) return null;
  
  const user = member.user || {};
  const userId = user._id || user.id || user;
  
  return {
    userId,
    fullname: user.fullname || user.name || 'Unknown User',
    username: user.username || 'unknown',
    email: user.email || 'no-email@example.com',
    avatar: user.avatar || null,
    role: member.role || 'member',
    joinedAt: member.joinedAt || new Date(),
    permissions: member.permissions || {}
  };
};

/**
 * Get safe team data with fallbacks
 * @param {Object} team - Team document
 * @returns {Object} - Safe team data
 */
export const getSafeTeamData = (team) => {
  if (!team) return null;
  
  const owner = team.owner || {};
  const ownerId = owner._id || owner.id || owner;
  
  return {
    _id: team._id,
    name: team.name || 'Unnamed Team',
    description: team.description || '',
    owner: {
      _id: ownerId,
      fullname: owner.fullname || owner.name || 'Unknown',
      username: owner.username || 'unknown',
      email: owner.email || 'no-email@example.com',
      avatar: owner.avatar || null
    },
    members: filterValidMembers(team.members || []).map(getSafeMemberData),
    projects: team.projects || [],
    inviteCode: team.inviteCode,
    isPrivate: team.isPrivate || false,
    settings: team.settings || {},
    createdAt: team.createdAt,
    updatedAt: team.updatedAt
  };
};

/**
 * Get safe project data with fallbacks
 * @param {Object} project - Project document
 * @returns {Object} - Safe project data
 */
export const getSafeProjectData = (project) => {
  if (!project) return null;
  
  const owner = project.owner || {};
  const ownerId = owner._id || owner.id || owner;
  
  const team = project.team || {};
  const teamId = team._id || team.id || team;
  
  return {
    _id: project._id,
    name: project.name || 'Unnamed Project',
    description: project.description || '',
    owner: {
      _id: ownerId,
      fullname: owner.fullname || owner.name || 'Unknown',
      username: owner.username || 'unknown',
      email: owner.email || 'no-email@example.com',
      avatar: owner.avatar || null
    },
    team: {
      _id: teamId,
      name: team.name || 'Unknown Team'
    },
    members: filterValidMembers(project.members || []).map(getSafeMemberData),
    tasks: project.tasks || [],
    status: project.status || 'planning',
    priority: project.priority || 'medium',
    startDate: project.startDate,
    endDate: project.endDate,
    settings: project.settings || {},
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
};

/**
 * Validate and repair team data
 * @param {Object} team - Team document
 * @returns {Object} - Repaired team data
 */
export const validateAndRepairTeamData = (team) => {
  if (!team) return null;
  
  // Ensure members array exists
  if (!Array.isArray(team.members)) {
    team.members = [];
  }
  
  // Filter out invalid members
  team.members = filterValidMembers(team.members);
  
  // Ensure owner exists
  if (!team.owner) {
    //console.warn('Team missing owner:', team._id);
  }
  
  // Ensure required fields
  if (!team.name) team.name = 'Unnamed Team';
  if (!team.inviteCode) team.inviteCode = '';
  
  return team;
};

/**
 * Validate and repair project data
 * @param {Object} project - Project document
 * @returns {Object} - Repaired project data
 */
export const validateAndRepairProjectData = (project) => {
  if (!project) return null;
  
  // Ensure members array exists
  if (!Array.isArray(project.members)) {
    project.members = [];
  }
  
  // Filter out invalid members
  project.members = filterValidMembers(project.members);
  
  // Ensure owner exists
  if (!project.owner) {
    //console.warn('Project missing owner:', project._id);
  }
  
  // Ensure required fields
  if (!project.name) project.name = 'Unnamed Project';
  if (!project.status) project.status = 'planning';
  if (!project.priority) project.priority = 'medium';
  
  return project;
};

export default {
  populateTeamData,
  populateProjectData,
  populateTeamMembers,
  populateProjectMembers,
  filterValidMembers,
  getSafeMemberData,
  getSafeTeamData,
  getSafeProjectData,
  validateAndRepairTeamData,
  validateAndRepairProjectData
};
