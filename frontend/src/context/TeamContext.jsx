import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import teamService from '../services/teamService';
import { useAuth } from './AuthContext';
import { useNotification } from '../hooks/useNotification';

// Initial state
const initialState = {
  teams: [],
  currentTeam: null,
  teamMembers: [],
  teamStats: null,
  teamActivity: [],
  invitations: [],
  loading: {
    teams: false,
    currentTeam: false,
    members: false,
    stats: false,
    activity: false,
    invitations: false,
    operations: false,
    validateInvite: false
  },
  errors: {
    teams: null,
    currentTeam: null,
    members: null,
    stats: null,
    activity: null,
    invitations: null,
    operations: null,
    validateInvite: null
  },
  filters: {
    search: '',
    status: 'all',
    role: 'all'
  },
  pagination: {
    teams: { page: 1, limit: 10, total: 0 },
    activity: { page: 1, limit: 20, total: 0 }
  }
};

// Action types
const ActionTypes = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Teams
  SET_TEAMS: 'SET_TEAMS',
  ADD_TEAM: 'ADD_TEAM',
  UPDATE_TEAM: 'UPDATE_TEAM',
  REMOVE_TEAM: 'REMOVE_TEAM',
  
  // Current team
  SET_CURRENT_TEAM: 'SET_CURRENT_TEAM',
  CLEAR_CURRENT_TEAM: 'CLEAR_CURRENT_TEAM',
  
  // Members
  SET_TEAM_MEMBERS: 'SET_TEAM_MEMBERS',
  ADD_TEAM_MEMBER: 'ADD_TEAM_MEMBER',
  UPDATE_TEAM_MEMBER: 'UPDATE_TEAM_MEMBER',
  REMOVE_TEAM_MEMBER: 'REMOVE_TEAM_MEMBER',
  
  // Stats and activity
  SET_TEAM_STATS: 'SET_TEAM_STATS',
  SET_TEAM_ACTIVITY: 'SET_TEAM_ACTIVITY',
  ADD_ACTIVITY: 'ADD_ACTIVITY',
  
  // Invitations
  SET_INVITATIONS: 'SET_INVITATIONS',
  ADD_INVITATION: 'ADD_INVITATION',
  UPDATE_INVITATION: 'UPDATE_INVITATION',
  REMOVE_INVITATION: 'REMOVE_INVITATION',
  
  // Filters and pagination
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  
  // Bulk operations
  BULK_UPDATE_TEAMS: 'BULK_UPDATE_TEAMS'
};

// Reducer function
function teamReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error
        },
        loading: {
          ...state.loading,
          [action.payload.key]: false
        }
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: null
        }
      };

    case ActionTypes.SET_TEAMS:
      return {
        ...state,
        teams: action.payload.teams,
        pagination: {
          ...state.pagination,
          teams: {
            ...state.pagination.teams,
            total: action.payload.total || action.payload.teams.length
          }
        },
        loading: {
          ...state.loading,
          teams: false
        },
        errors: {
          ...state.errors,
          teams: null
        }
      };

    case ActionTypes.ADD_TEAM:
      return {
        ...state,
        teams: [action.payload.team, ...state.teams],
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.UPDATE_TEAM:
      return {
        ...state,
        teams: state.teams.map(team =>
          team._id === action.payload.team._id ? action.payload.team : team
        ),
        currentTeam: state.currentTeam?._id === action.payload.team._id 
          ? action.payload.team 
          : state.currentTeam,
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.REMOVE_TEAM:
      return {
        ...state,
        teams: state.teams.filter(team => team._id !== action.payload.teamId),
        currentTeam: state.currentTeam?._id === action.payload.teamId ? null : state.currentTeam,
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.SET_CURRENT_TEAM:
      return {
        ...state,
        currentTeam: action.payload.team,
        teamMembers: action.payload.team?.members || [],
        loading: {
          ...state.loading,
          currentTeam: false
        },
        errors: {
          ...state.errors,
          currentTeam: null
        }
      };

    case ActionTypes.CLEAR_CURRENT_TEAM:
      return {
        ...state,
        currentTeam: null,
        teamMembers: [],
        teamStats: null,
        teamActivity: []
      };

    case ActionTypes.SET_TEAM_MEMBERS:
      return {
        ...state,
        teamMembers: action.payload.members,
        loading: {
          ...state.loading,
          members: false
        },
        errors: {
          ...state.errors,
          members: null
        }
      };

    case ActionTypes.ADD_TEAM_MEMBER:
      return {
        ...state,
        teamMembers: [...state.teamMembers, action.payload.member],
        currentTeam: state.currentTeam ? {
          ...state.currentTeam,
          members: [...state.currentTeam.members, action.payload.member]
        } : state.currentTeam
      };

    case ActionTypes.UPDATE_TEAM_MEMBER:
      return {
        ...state,
        teamMembers: state.teamMembers.map(member =>
          member.user._id === action.payload.member.user._id ? action.payload.member : member
        ),
        currentTeam: state.currentTeam ? {
          ...state.currentTeam,
          members: state.currentTeam.members.map(member =>
            member.user._id === action.payload.member.user._id ? action.payload.member : member
          )
        } : state.currentTeam
      };

    case ActionTypes.REMOVE_TEAM_MEMBER:
      return {
        ...state,
        teamMembers: state.teamMembers.filter(member => member.user._id !== action.payload.userId),
        currentTeam: state.currentTeam ? {
          ...state.currentTeam,
          members: state.currentTeam.members.filter(member => member.user._id !== action.payload.userId)
        } : state.currentTeam
      };

    case ActionTypes.SET_TEAM_STATS:
      return {
        ...state,
        teamStats: action.payload.stats,
        loading: {
          ...state.loading,
          stats: false
        },
        errors: {
          ...state.errors,
          stats: null
        }
      };

    case ActionTypes.SET_TEAM_ACTIVITY:
      return {
        ...state,
        teamActivity: action.payload.append 
          ? [...state.teamActivity, ...action.payload.activities]
          : action.payload.activities,
        pagination: {
          ...state.pagination,
          activity: {
            ...state.pagination.activity,
            total: action.payload.total || state.pagination.activity.total
          }
        },
        loading: {
          ...state.loading,
          activity: false
        },
        errors: {
          ...state.errors,
          activity: null
        }
      };

    case ActionTypes.ADD_ACTIVITY:
      return {
        ...state,
        teamActivity: [action.payload.activity, ...state.teamActivity]
      };

    case ActionTypes.SET_INVITATIONS:
      return {
        ...state,
        invitations: action.payload.invitations,
        loading: {
          ...state.loading,
          invitations: false
        },
        errors: {
          ...state.errors,
          invitations: null
        }
      };

    case ActionTypes.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload.filters
        }
      };

    case ActionTypes.SET_PAGINATION:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          [action.payload.key]: {
            ...state.pagination[action.payload.key],
            ...action.payload.pagination
          }
        }
      };

    case ActionTypes.BULK_UPDATE_TEAMS:
      return {
        ...state,
        teams: action.payload.teams,
        loading: {
          ...state.loading,
          operations: false
        }
      };

    default:
      return state;
  }
}

// Create context
const TeamContext = createContext();

// Custom hook to use team context
export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

// Team provider component
export const TeamProvider = ({ children }) => {
  const [state, dispatch] = useReducer(teamReducer, initialState);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Helper function to set loading state
  const setLoading = useCallback((key, value) => {
    dispatch({
      type: ActionTypes.SET_LOADING,
      payload: { key, value }
    });
  }, []);

  // Helper function to set error state
  const setError = useCallback((key, error) => {
    dispatch({
      type: ActionTypes.SET_ERROR,
      payload: { key, error }
    });
  }, []);

  // Helper function to clear error state
  const clearError = useCallback((key) => {
    dispatch({
      type: ActionTypes.CLEAR_ERROR,
      payload: { key }
    });
  }, []);

  // Fetch all teams
  const fetchTeams = useCallback(async (options = {}) => {
    const { showLoading = true, showErrors = true } = options;
    
    if (showLoading) {
      setLoading('teams', true);
    }
    
    try {
      const result = await teamService.getTeams();
      
      if (result.success) {
        const teams = result.data || [];
        
        dispatch({
          type: ActionTypes.SET_TEAMS,
          payload: { teams, total: teams.length }
        });
        return result;
      } else {
        // Set loading to false on error
        setLoading('teams', false);
        if (showErrors) {
          setError('teams', result.message);
          showNotification({
            type: 'error',
            message: result.message
          });
        }
        // Set empty teams array on error
        dispatch({
          type: ActionTypes.SET_TEAMS,
          payload: { teams: [], total: 0 }
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch teams';
      // Set loading to false on error
      setLoading('teams', false);
      if (showErrors) {
        setError('teams', errorMessage);
        showNotification({
          type: 'error',
          message: errorMessage
        });
      }
      // Set empty teams array on error
      dispatch({
        type: ActionTypes.SET_TEAMS,
        payload: { teams: [], total: 0 }
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Fetch specific team
  const fetchTeam = useCallback(async (teamId, options = {}) => {
    const { showLoading = true, showErrors = true } = options;
    
    if (showLoading) {
      setLoading('currentTeam', true);
    }
    
    try {
      const result = await teamService.getTeam(teamId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.SET_CURRENT_TEAM,
          payload: { team: result.data }
        });
        return result;
      } else {
        if (showErrors) {
          setError('currentTeam', result.message);
          showNotification({
            type: 'error',
            message: result.message
          });
        }
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch team';
      if (showErrors) {
        setError('currentTeam', errorMessage);
        showNotification({
          type: 'error',
          message: errorMessage
        });
      }
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Create new team
  const createTeam = useCallback(async (teamData) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.createTeam(teamData);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.ADD_TEAM,
          payload: { team: result.data }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to create team';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Update team
  const updateTeam = useCallback(async (teamId, updateData) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.updateTeam(teamId, updateData);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_TEAM,
          payload: { team: result.data }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to update team';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Delete team
  const deleteTeam = useCallback(async (teamId) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.deleteTeam(teamId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.REMOVE_TEAM,
          payload: { teamId }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to delete team';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Archive team
  const archiveTeam = useCallback(async (teamId) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.archiveTeam(teamId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_TEAM,
          payload: { team: result.data }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to archive team';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    } finally {
      setLoading('operations', false);
    }
  }, [setLoading, setError, showNotification]);

  // Unarchive team
  const unarchiveTeam = useCallback(async (teamId) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.unarchiveTeam(teamId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_TEAM,
          payload: { team: result.data }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to unarchive team';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    } finally {
      setLoading('operations', false);
    }
  }, [setLoading, setError, showNotification]);

  // Add team member
  const addTeamMember = useCallback(async (teamId, userId, role = 'member') => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.addMember(teamId, userId, role);
      
      if (result.success) {
        // Update the team in state
        dispatch({
          type: ActionTypes.UPDATE_TEAM,
          payload: { team: result.data }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to add team member';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Update team member role
  const updateTeamMemberRole = useCallback(async (teamId, userId, role) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.updateMemberRole(teamId, userId, role);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_TEAM,
          payload: { team: result.data }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to update member role';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Remove team member
  const removeTeamMember = useCallback(async (teamId, userId) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.removeMember(teamId, userId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_TEAM,
          payload: { team: result.data }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to remove team member';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Join team with invite code
  const joinTeam = useCallback(async (inviteCode) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.joinTeam(inviteCode);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.ADD_TEAM,
          payload: { team: result.data }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to join team';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Validate invite code (returns team info without joining)
  const validateInviteCode = useCallback(async (inviteCode) => {
    setLoading('validateInvite', true);
    clearError('validateInvite');
    
    try {
      const result = await teamService.validateInviteCode(inviteCode);
      setLoading('validateInvite', false);
      
      if (result.success) {
        return result.data;
      } else {
        setError('validateInvite', result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error.message || 'Invalid invite code';
      setLoading('validateInvite', false);
      setError('validateInvite', errorMessage);
      throw new Error(errorMessage);
    }
  }, [setLoading, setError, clearError]);

  // Join team by invite code (alias for joinTeam with better return)
  const joinTeamByInviteCode = useCallback(async (inviteCode) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.joinTeam(inviteCode);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.ADD_TEAM,
          payload: { team: result.data }
        });
        
        return { success: true, teamId: result.data._id };
      } else {
        setError('operations', result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to join team';
      setError('operations', errorMessage);
      throw new Error(errorMessage);
    }
  }, [setLoading, setError]);

  // Leave team
  const leaveTeam = useCallback(async (teamId) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.leaveTeam(teamId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.REMOVE_TEAM,
          payload: { teamId }
        });
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to leave team';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Regenerate invite code
  const regenerateInviteCode = useCallback(async (teamId) => {
    setLoading('operations', true);
    
    try {
      const result = await teamService.regenerateInviteCode(teamId);
      
      if (result.success) {
        // Update current team if it matches
        if (state.currentTeam && state.currentTeam._id === teamId) {
          dispatch({
            type: ActionTypes.SET_CURRENT_TEAM,
            payload: {
              team: {
                ...state.currentTeam,
                inviteCode: result.data.inviteCode
              }
            }
          });
        }
        
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to regenerate invite code';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [state.currentTeam, setLoading, setError, showNotification]);

  // Send invitations
  const sendInvitations = useCallback(async (teamId, emails, role = 'member', message = '') => {
    setLoading('invitations', true);
    
    try {
      const result = await teamService.sendInvitations(teamId, emails, role, message);
      
      if (result.success) {
        showNotification({
          type: 'success',
          message: result.message
        });
        
        return result;
      } else {
        setError('invitations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to send invitations';
      setError('invitations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Fetch team statistics
  const fetchTeamStats = useCallback(async (teamId) => {
    setLoading('stats', true);
    
    try {
      const result = await teamService.getTeamStats(teamId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.SET_TEAM_STATS,
          payload: { stats: result.data }
        });
        return result;
      } else {
        setError('stats', result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch team statistics';
      setError('stats', errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError]);

  // Fetch team activity
  const fetchTeamActivity = useCallback(async (teamId, options = {}) => {
    const { append = false, limit = 20, offset = 0 } = options;
    
    setLoading('activity', true);
    
    try {
      const result = await teamService.getTeamActivity(teamId, { limit, offset });
      
      if (result.success) {
        dispatch({
          type: ActionTypes.SET_TEAM_ACTIVITY,
          payload: { 
            activities: result.data.activities || result.data,
            total: result.data.total,
            append 
          }
        });
        return result;
      } else {
        setError('activity', result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch team activity';
      setError('activity', errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError]);

  // Set current team
  const setCurrentTeam = useCallback((team) => {
    dispatch({
      type: ActionTypes.SET_CURRENT_TEAM,
      payload: { team }
    });
  }, []);

  // Clear current team
  const clearCurrentTeam = useCallback(() => {
    dispatch({
      type: ActionTypes.CLEAR_CURRENT_TEAM
    });
  }, []);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({
      type: ActionTypes.SET_FILTERS,
      payload: { filters }
    });
  }, []);

  // Set pagination
  const setPagination = useCallback((key, pagination) => {
    dispatch({
      type: ActionTypes.SET_PAGINATION,
      payload: { key, pagination }
    });
  }, []);

  // Get filtered teams
  const getFilteredTeams = useCallback(() => {
    let filtered = [...state.teams];
    
    if (state.filters.search) {
      const searchLower = state.filters.search.toLowerCase();
      filtered = filtered.filter(team =>
        team.name.toLowerCase().includes(searchLower) ||
        team.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [state.teams, state.filters]);

  // Get user role in team
  const getUserRoleInTeam = useCallback((teamId, userId = user?._id || user?.id) => {
    const team = state.teams.find(t => t._id === teamId);
    if (!team) return null;
    
    // Check multiple ID formats for compatibility
    const member = team.members?.find(m => {
      const memberId = m.user?._id || m.user?.id || m.user;
      return memberId === userId || memberId === user?._id || memberId === user?.id;
    });
    
    return member?.role || null;
  }, [state.teams, user]);

  // Check if user can perform action
  const canPerformAction = useCallback((teamId, action, userId = user?._id || user?.id) => {
    // First check if user is the team owner
    const team = state.teams.find(t => t._id === teamId);
    if (team) {
      const ownerId = team.owner?._id || team.owner?.id || team.owner;
      const currentUserId = userId || user?._id || user?.id;
      if (ownerId === currentUserId) {
        return true; // Owner has all permissions
      }
    }
    
    const role = getUserRoleInTeam(teamId, userId);
    if (!role) return false;
    
    const permissions = {
      owner: ['all'],
      admin: ['manage_members', 'manage_projects', 'manage_settings', 'manage_team_settings', 'invite_members', 'edit_team', 'view_team_analytics'],
      member: ['view', 'create_projects', 'view_team', 'view_team_members']
    };
    
    return permissions[role]?.includes(action) || permissions[role]?.includes('all');
  }, [getUserRoleInTeam, user, state.teams]);

  // Auto-fetch teams when user changes (disabled to prevent infinite loops)
  // Teams are fetched manually from the Teams page
  // useEffect(() => {
  //   if (user && state.teams.length === 0) {
  //     fetchTeams({ showLoading: true, showErrors: false });
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [user]);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Computed values
    filteredTeams: getFilteredTeams(),
    
    // Actions
    fetchTeams,
    fetchTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    archiveTeam,
    unarchiveTeam,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    joinTeam,
    validateInviteCode,
    joinTeamByInviteCode,
    leaveTeam,
    regenerateInviteCode,
    sendInvitations,
    fetchTeamStats,
    fetchTeamActivity,
    setCurrentTeam,
    clearCurrentTeam,
    setFilters,
    setPagination,
    
    // Utilities
    getUserRoleInTeam,
    canPerformAction,
    clearError
  };

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
};

export default TeamContext;