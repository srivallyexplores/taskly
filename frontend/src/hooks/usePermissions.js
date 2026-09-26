import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useProject } from '../context/ProjectContext';

// Permission definitions
const TEAM_PERMISSIONS = {
  // Team management
  'edit_team': ['owner', 'admin'],
  'delete_team': ['owner'],
  'manage_members': ['owner', 'admin'],
  'invite_members': ['owner', 'admin'],
  'remove_members': ['owner', 'admin'],
  'change_member_roles': ['owner', 'admin'],
  
  // Project management within team
  'create_projects': ['owner', 'admin'],
  'manage_team_projects': ['owner', 'admin'],
  
  // Team settings
  'manage_team_settings': ['owner', 'admin'],
  'view_team_analytics': ['owner', 'admin', 'member'],
  'generate_invite_codes': ['owner', 'admin'],
  
  // Basic permissions
  'view_team': ['owner', 'admin', 'member'],
  'view_team_members': ['owner', 'admin', 'member']
};

const PROJECT_PERMISSIONS = {
  // Project management
  'edit_project': ['owner', 'admin'],
  'delete_project': ['owner'],
  'archive_project': ['owner', 'admin'],
  'manage_project_settings': ['owner', 'admin'],
  
  // Member management
  'manage_members': ['owner', 'admin'],
  'invite_members': ['owner', 'admin'],
  'remove_members': ['owner', 'admin'],
  'change_member_roles': ['owner', 'admin'],
  
  // Task management
  'create_tasks': ['owner', 'admin', 'member'],
  'manage_tasks': ['owner', 'admin'],
  'assign_tasks': ['owner', 'admin'],
  'delete_tasks': ['owner', 'admin'],
  
  // Project content
  'view_project': ['owner', 'admin', 'member'],
  'view_project_analytics': ['owner', 'admin'],
  'manage_milestones': ['owner', 'admin'],
  
  // Comments and collaboration
  'add_comments': ['owner', 'admin', 'member'],
  'manage_comments': ['owner', 'admin']
};

/**
 * Hook for checking user permissions within teams and projects
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const { teams, currentTeam } = useTeam();
  const { projects, currentProject } = useProject();

  // Get user's role in a specific team
  const getTeamRole = useMemo(() => {
    return (teamId) => {
      if (!user || !teams) return null;
      
      const team = teamId === 'current' ? currentTeam : teams.find(t => t._id === teamId);
      if (!team) return null;
      
      const membership = team.members?.find(m => m.user._id === user._id);
      return membership?.role || null;
    };
  }, [user, teams, currentTeam]);

  // Get user's role in a specific project
  const getProjectRole = useMemo(() => {
    return (projectId) => {
      if (!user || !projects) return null;
      
      const project = projectId === 'current' ? currentProject : projects.find(p => p._id === projectId);
      if (!project) return null;
      
      const membership = project.members?.find(m => m.user._id === user._id);
      return membership?.role || null;
    };
  }, [user, projects, currentProject]);

  // Check if user has a specific team permission
  const hasTeamPermission = useMemo(() => {
    return (teamId, permission) => {
      const role = getTeamRole(teamId);
      if (!role) return false;
      
      const allowedRoles = TEAM_PERMISSIONS[permission];
      return allowedRoles ? allowedRoles.includes(role) : false;
    };
  }, [getTeamRole]);

  // Check if user has a specific project permission
  const hasProjectPermission = useMemo(() => {
    return (projectId, permission) => {
      const role = getProjectRole(projectId);
      if (!role) return false;
      
      const allowedRoles = PROJECT_PERMISSIONS[permission];
      return allowedRoles ? allowedRoles.includes(role) : false;
    };
  }, [getProjectRole]);

  // Check if user can perform an action (unified interface)
  const canPerformAction = useMemo(() => {
    return (entityId, entityType, action) => {
      if (entityType === 'team') {
        return hasTeamPermission(entityId, action);
      } else if (entityType === 'project') {
        return hasProjectPermission(entityId, action);
      }
      return false;
    };
  }, [hasTeamPermission, hasProjectPermission]);

  // Get all permissions for a user in a team
  const getTeamPermissions = useMemo(() => {
    return (teamId) => {
      const role = getTeamRole(teamId);
      if (!role) return [];
      
      return Object.entries(TEAM_PERMISSIONS)
        .filter(([_, allowedRoles]) => allowedRoles.includes(role))
        .map(([permission]) => permission);
    };
  }, [getTeamRole]);

  // Get all permissions for a user in a project
  const getProjectPermissions = useMemo(() => {
    return (projectId) => {
      const role = getProjectRole(projectId);
      if (!role) return [];
      
      return Object.entries(PROJECT_PERMISSIONS)
        .filter(([_, allowedRoles]) => allowedRoles.includes(role))
        .map(([permission]) => permission);
    };
  }, [getProjectRole]);

  // Check if user is owner of team or project
  const isOwner = useMemo(() => {
    return (entityId, entityType) => {
      if (entityType === 'team') {
        return getTeamRole(entityId) === 'owner';
      } else if (entityType === 'project') {
        return getProjectRole(entityId) === 'owner';
      }
      return false;
    };
  }, [getTeamRole, getProjectRole]);

  // Check if user is admin or owner
  const isAdminOrOwner = useMemo(() => {
    return (entityId, entityType) => {
      const role = entityType === 'team' ? getTeamRole(entityId) : getProjectRole(entityId);
      return role === 'admin' || role === 'owner';
    };
  }, [getTeamRole, getProjectRole]);

  // Check if user is member of team or project
  const isMember = useMemo(() => {
    return (entityId, entityType) => {
      const role = entityType === 'team' ? getTeamRole(entityId) : getProjectRole(entityId);
      return role !== null;
    };
  }, [getTeamRole, getProjectRole]);

  return {
    // Role getters
    getTeamRole,
    getProjectRole,
    
    // Permission checkers
    hasTeamPermission,
    hasProjectPermission,
    canPerformAction,
    
    // Permission lists
    getTeamPermissions,
    getProjectPermissions,
    
    // Role checkers
    isOwner,
    isAdminOrOwner,
    isMember,
    
    // Permission constants for reference
    TEAM_PERMISSIONS,
    PROJECT_PERMISSIONS
  };
};

/**
 * Hook for checking permissions in the current team context
 */
export const useTeamPermissions = (teamId = 'current') => {
  const permissions = usePermissions();
  
  return {
    role: permissions.getTeamRole(teamId),
    hasPermission: (permission) => permissions.hasTeamPermission(teamId, permission),
    permissions: permissions.getTeamPermissions(teamId),
    isOwner: permissions.isOwner(teamId, 'team'),
    isAdminOrOwner: permissions.isAdminOrOwner(teamId, 'team'),
    isMember: permissions.isMember(teamId, 'team')
  };
};

/**
 * Hook for checking permissions in the current project context
 */
export const useProjectPermissions = (projectId = 'current') => {
  const permissions = usePermissions();
  
  return {
    role: permissions.getProjectRole(projectId),
    hasPermission: (permission) => permissions.hasProjectPermission(projectId, permission),
    permissions: permissions.getProjectPermissions(projectId),
    isOwner: permissions.isOwner(projectId, 'project'),
    isAdminOrOwner: permissions.isAdminOrOwner(projectId, 'project'),
    isMember: permissions.isMember(projectId, 'project')
  };
};

export default usePermissions;