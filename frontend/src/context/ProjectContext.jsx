import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import projectService from '../services/projectService';
import { useAuth } from './AuthContext';
import { useNotification } from '../hooks/useNotification';
import { useTasks } from './TaskContext';

// Initial state
const initialState = {
  projects: [],
  currentProject: null,
  projectMembers: [],
  projectTasks: [],
  projectStats: null,
  projectActivity: [],
  projectTimeline: [],
  milestones: [],
  loading: {
    projects: false,
    currentProject: false,
    members: false,
    tasks: false,
    stats: false,
    activity: false,
    timeline: false,
    operations: false
  },
  errors: {
    projects: null,
    currentProject: null,
    members: null,
    tasks: null,
    stats: null,
    activity: null,
    timeline: null,
    operations: null
  },
  filters: {
    search: '',
    status: 'all',
    priority: 'all',
    teamId: null,
    assignee: null
  },
  pagination: {
    projects: { page: 1, limit: 10, total: 0 },
    tasks: { page: 1, limit: 20, total: 0 },
    activity: { page: 1, limit: 20, total: 0 }
  }
};

// Action types
const ActionTypes = {
  // Loading and errors
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Projects
  SET_PROJECTS: 'SET_PROJECTS',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  REMOVE_PROJECT: 'REMOVE_PROJECT',
  
  // Current project
  SET_CURRENT_PROJECT: 'SET_CURRENT_PROJECT',
  CLEAR_CURRENT_PROJECT: 'CLEAR_CURRENT_PROJECT',  

  // Members
  SET_PROJECT_MEMBERS: 'SET_PROJECT_MEMBERS',
  ADD_PROJECT_MEMBER: 'ADD_PROJECT_MEMBER',
  UPDATE_PROJECT_MEMBER: 'UPDATE_PROJECT_MEMBER',
  REMOVE_PROJECT_MEMBER: 'REMOVE_PROJECT_MEMBER',
  
  // Tasks
  SET_PROJECT_TASKS: 'SET_PROJECT_TASKS',
  ADD_PROJECT_TASK: 'ADD_PROJECT_TASK',
  UPDATE_PROJECT_TASK: 'UPDATE_PROJECT_TASK',
  REMOVE_PROJECT_TASK: 'REMOVE_PROJECT_TASK',
  
  // Stats and analytics
  SET_PROJECT_STATS: 'SET_PROJECT_STATS',
  SET_PROJECT_ACTIVITY: 'SET_PROJECT_ACTIVITY',
  ADD_ACTIVITY: 'ADD_ACTIVITY',
  
  // Timeline and milestones
  SET_PROJECT_TIMELINE: 'SET_PROJECT_TIMELINE',
  SET_MILESTONES: 'SET_MILESTONES',
  ADD_MILESTONE: 'ADD_MILESTONE',
  UPDATE_MILESTONE: 'UPDATE_MILESTONE',
  REMOVE_MILESTONE: 'REMOVE_MILESTONE',
  
  // Filters and pagination
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  
  // Bulk operations
  BULK_UPDATE_PROJECTS: 'BULK_UPDATE_PROJECTS'
};

// Reducer function
function projectReducer(state, action) {
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

    case ActionTypes.SET_PROJECTS:
      return {
        ...state,
        projects: action.payload.projects,
        pagination: {
          ...state.pagination,
          projects: {
            ...state.pagination.projects,
            total: action.payload.total || action.payload.projects.length
          }
        },
        loading: {
          ...state.loading,
          projects: false
        },
        errors: {
          ...state.errors,
          projects: null
        }
      };

    case ActionTypes.ADD_PROJECT:
      return {
        ...state,
        projects: [action.payload.project, ...state.projects],
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.UPDATE_PROJECT:
      if (!action.payload?.project?._id) {
        return state;
      }
      return {
        ...state,
        projects: state.projects.map(project =>
          project._id === action.payload.project._id ? action.payload.project : project
        ),
        currentProject: state.currentProject?._id === action.payload.project._id 
          ? action.payload.project 
          : state.currentProject,
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.REMOVE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(project => project._id !== action.payload.projectId),
        currentProject: state.currentProject?._id === action.payload.projectId ? null : state.currentProject,
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.SET_CURRENT_PROJECT:
      return {
        ...state,
        currentProject: action.payload.project,
        projectMembers: action.payload.project?.members || [],
        milestones: action.payload.project?.milestones || [],
        loading: {
          ...state.loading,
          currentProject: false
        },
        errors: {
          ...state.errors,
          currentProject: null
        }
      };

    case ActionTypes.CLEAR_CURRENT_PROJECT:
      return {
        ...state,
        currentProject: null,
        projectMembers: [],
        projectTasks: [],
        projectStats: null,
        projectActivity: [],
        projectTimeline: [],
        milestones: []
      };

    case ActionTypes.SET_PROJECT_MEMBERS:
      return {
        ...state,
        projectMembers: action.payload.members,
        loading: {
          ...state.loading,
          members: false
        },
        errors: {
          ...state.errors,
          members: null
        }
      };

    case ActionTypes.SET_PROJECT_TASKS:
      return {
        ...state,
        projectTasks: action.payload.tasks,
        pagination: {
          ...state.pagination,
          tasks: {
            ...state.pagination.tasks,
            total: action.payload.total || action.payload.tasks.length
          }
        },
        loading: {
          ...state.loading,
          tasks: false
        },
        errors: {
          ...state.errors,
          tasks: null
        }
      };

    case ActionTypes.ADD_PROJECT_TASK:
      return {
        ...state,
        projectTasks: [action.payload.task, ...state.projectTasks]
      };

    case ActionTypes.UPDATE_PROJECT_TASK:
      return {
        ...state,
        projectTasks: state.projectTasks.map(task =>
          task._id === action.payload.task._id ? action.payload.task : task
        )
      };

    case ActionTypes.REMOVE_PROJECT_TASK:
      return {
        ...state,
        projectTasks: state.projectTasks.filter(task => task._id !== action.payload.taskId)
      };

    case ActionTypes.SET_PROJECT_STATS:
      return {
        ...state,
        projectStats: action.payload.stats,
        loading: {
          ...state.loading,
          stats: false
        },
        errors: {
          ...state.errors,
          stats: null
        }
      };

    case ActionTypes.SET_PROJECT_ACTIVITY:
      return {
        ...state,
        projectActivity: action.payload.append 
          ? [...state.projectActivity, ...action.payload.activities]
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
        projectActivity: [action.payload.activity, ...state.projectActivity]
      };

    case ActionTypes.SET_PROJECT_TIMELINE:
      return {
        ...state,
        projectTimeline: action.payload.timeline,
        loading: {
          ...state.loading,
          timeline: false
        },
        errors: {
          ...state.errors,
          timeline: null
        }
      };

    case ActionTypes.SET_MILESTONES:
      return {
        ...state,
        milestones: action.payload.milestones
      };

    case ActionTypes.ADD_MILESTONE:
      return {
        ...state,
        milestones: [...state.milestones, action.payload.milestone],
        currentProject: state.currentProject ? {
          ...state.currentProject,
          milestones: [...(state.currentProject.milestones || []), action.payload.milestone]
        } : state.currentProject
      };

    case ActionTypes.UPDATE_MILESTONE:
      return {
        ...state,
        milestones: state.milestones.map(milestone =>
          milestone._id === action.payload.milestone._id ? action.payload.milestone : milestone
        ),
        currentProject: state.currentProject ? {
          ...state.currentProject,
          milestones: (state.currentProject.milestones || []).map(milestone =>
            milestone._id === action.payload.milestone._id ? action.payload.milestone : milestone
          )
        } : state.currentProject
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

    case ActionTypes.BULK_UPDATE_PROJECTS:
      return {
        ...state,
        projects: action.payload.projects,
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
const ProjectContext = createContext();

// Custom hook to use project context
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

// Project provider component
export const ProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { createTask, updateTask, deleteTask } = useTasks();

  // Helper functions
  const setLoading = useCallback((key, value) => {
    dispatch({
      type: ActionTypes.SET_LOADING,
      payload: { key, value }
    });
  }, []);

  const setError = useCallback((key, error) => {
    dispatch({
      type: ActionTypes.SET_ERROR,
      payload: { key, error }
    });
  }, []);

  const clearError = useCallback((key) => {
    dispatch({
      type: ActionTypes.CLEAR_ERROR,
      payload: { key }
    });
  }, []);

  // Fetch all projects
  const fetchProjects = useCallback(async (filters = {}, options = {}) => {
    const { showLoading = true, showErrors = true } = options;
    
    if (showLoading) {
      setLoading('projects', true);
    }
    
    try {
      const result = await projectService.getProjects(filters);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.SET_PROJECTS,
          payload: { projects: result.data || [], total: (result.data || []).length }
        });
        return result;
      } else {
        // Set loading to false on error
        setLoading('projects', false);
        if (showErrors) {
          setError('projects', result.message);
          showNotification({
            type: 'error',
            message: result.message
          });
        }
        // Set empty projects array on error
        dispatch({
          type: ActionTypes.SET_PROJECTS,
          payload: { projects: [], total: 0 }
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch projects';
      // Set loading to false on error
      setLoading('projects', false);
      if (showErrors) {
        setError('projects', errorMessage);
        showNotification({
          type: 'error',
          message: errorMessage
        });
      }
      // Set empty projects array on error
      dispatch({
        type: ActionTypes.SET_PROJECTS,
        payload: { projects: [], total: 0 }
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Fetch specific project
  const fetchProject = useCallback(async (projectId, options = {}) => {
    const { showLoading = true, showErrors = true } = options;
    
    if (showLoading) {
      setLoading('currentProject', true);
    }
    
    try {
      const result = await projectService.getProject(projectId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.SET_CURRENT_PROJECT,
          payload: { project: result.data }
        });
        return result;
      } else {
        if (showErrors) {
          setError('currentProject', result.message);
          showNotification({
            type: 'error',
            message: result.message
          });
        }
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch project';
      if (showErrors) {
        setError('currentProject', errorMessage);
        showNotification({
          type: 'error',
          message: errorMessage
        });
      }
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Create new project
  const createProject = useCallback(async (projectData) => {
    setLoading('operations', true);
    
    try {
      const result = await projectService.createProject(projectData);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.ADD_PROJECT,
          payload: { project: result.data }
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
      const errorMessage = 'Failed to create project';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Update project
  const updateProject = useCallback(async (projectId, updateData) => {
    setLoading('operations', true);
    
    try {
      const result = await projectService.updateProject(projectId, updateData);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_PROJECT,
          payload: { project: result.data }
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
      const errorMessage = 'Failed to update project';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Delete project
  const deleteProject = useCallback(async (projectId) => {
    setLoading('operations', true);
    
    try {
      const result = await projectService.deleteProject(projectId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.REMOVE_PROJECT,
          payload: { projectId }
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
      const errorMessage = 'Failed to delete project';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Add project member
  const addProjectMember = useCallback(async (projectId, userId, role = 'contributor') => {
    setLoading('operations', true);
    
    try {
      const result = await projectService.addMember(projectId, userId, role);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_PROJECT,
          payload: { project: result.data }
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
      const errorMessage = 'Failed to add project member';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Update project member role
  const updateProjectMemberRole = useCallback(async (projectId, userId, role) => {
    setLoading('operations', true);
    
    try {
      const result = await projectService.updateMemberRole(projectId, userId, role);
      
      if (result.success && result.data) {
        // Refresh the project to get updated member list
        await fetchProject(projectId, { showLoading: false });
        
        showNotification({
          type: 'success',
          message: result.message || 'Member role updated successfully'
        });
        
        return result;
      } else {
        setError('operations', result.message || 'Failed to update member role');
        showNotification({
          type: 'error',
          message: result.message || 'Failed to update member role'
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

  // Remove project member
  const removeProjectMember = useCallback(async (projectId, userId) => {
    setLoading('operations', true);
    
    try {
      const result = await projectService.removeMember(projectId, userId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_PROJECT,
          payload: { project: result.data }
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
      const errorMessage = 'Failed to remove project member';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Fetch project tasks
  const fetchProjectTasks = useCallback(async (projectId, filters = {}) => {
    setLoading('tasks', true);
    
    try {
      const result = await projectService.getProjectTasks(projectId, filters);
      
      if (result.success) {
        const tasks = Array.isArray(result.data) ? result.data : [];
        dispatch({
          type: ActionTypes.SET_PROJECT_TASKS,
          payload: { tasks, total: tasks.length }
        });
        return result;
      } else {
        setError('tasks', result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch project tasks';
      setError('tasks', errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError]);

  // Create project task (integrates with TaskContext)
  const createProjectTask = useCallback(async (taskData) => {
    try {
      const projectTaskData = {
        ...taskData,
        project: state.currentProject?._id
      };
      
      const result = await createTask(projectTaskData);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.ADD_PROJECT_TASK,
          payload: { task: result.data }
        });
        
        // Update project stats if available
        if (state.currentProject) {
          fetchProjectStats(state.currentProject._id);
        }
      }
      
      return result;
    } catch (error) {
      return { success: false, message: 'Failed to create project task' };
    }
  }, [state.currentProject, createTask]);

  // Update project task (integrates with TaskContext)
  const updateProjectTask = useCallback(async (taskId, updateData) => {
    try {
      const result = await updateTask(taskId, updateData);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_PROJECT_TASK,
          payload: { task: result.data }
        });
        
        // Update project stats if available
        if (state.currentProject) {
          fetchProjectStats(state.currentProject._id);
        }
      }
      
      return result;
    } catch (error) {
      return { success: false, message: 'Failed to update project task' };
    }
  }, [updateTask, state.currentProject]);

  // Delete project task (integrates with TaskContext)
  const deleteProjectTask = useCallback(async (taskId) => {
    try {
      const result = await deleteTask(taskId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.REMOVE_PROJECT_TASK,
          payload: { taskId }
        });
        
        // Update project stats if available
        if (state.currentProject) {
          fetchProjectStats(state.currentProject._id);
        }
      }
      
      return result;
    } catch (error) {
      return { success: false, message: 'Failed to delete project task' };
    }
  }, [deleteTask, state.currentProject]);

  // Fetch project statistics
  const fetchProjectStats = useCallback(async (projectId) => {
    setLoading('stats', true);
    
    try {
      const result = await projectService.getProjectStats(projectId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.SET_PROJECT_STATS,
          payload: { stats: result.data }
        });
        return result;
      } else {
        setError('stats', result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch project statistics';
      setError('stats', errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError]);

  // Fetch project activity
  const fetchProjectActivity = useCallback(async (projectId, options = {}) => {
    const { append = false, limit = 20, offset = 0 } = options;
    
    setLoading('activity', true);
    
    try {
      const result = await projectService.getProjectActivity(projectId, { limit, offset });
      
      if (result.success) {
        dispatch({
          type: ActionTypes.SET_PROJECT_ACTIVITY,
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
      const errorMessage = 'Failed to fetch project activity';
      setError('activity', errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError]);

  // Add milestone
  const addMilestone = useCallback(async (projectId, milestoneData) => {
    setLoading('operations', true);
    
    try {
      const result = await projectService.addMilestone(projectId, milestoneData);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_PROJECT,
          payload: { project: result.data }
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
      const errorMessage = 'Failed to add milestone';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Update milestone status
  const updateMilestoneStatus = useCallback(async (projectId, milestoneId, status) => {
    setLoading('operations', true);
    
    try {
      const result = await projectService.updateMilestoneStatus(projectId, milestoneId, status);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_PROJECT,
          payload: { project: result.data }
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
      const errorMessage = 'Failed to update milestone status';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Archive project
  const archiveProject = useCallback(async (projectId) => {
    setLoading('operations', true);
    
    try {
      const result = await projectService.archiveProject(projectId);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_PROJECT,
          payload: { project: result.data }
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
      const errorMessage = 'Failed to archive project';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Set current project
  const setCurrentProject = useCallback((project) => {
    dispatch({
      type: ActionTypes.SET_CURRENT_PROJECT,
      payload: { project }
    });
  }, []);

  // Clear current project
  const clearCurrentProject = useCallback(() => {
    dispatch({
      type: ActionTypes.CLEAR_CURRENT_PROJECT
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

  // Get filtered projects
  const getFilteredProjects = useCallback(() => {
    let filtered = [...state.projects];
    
    if (state.filters.search) {
      const searchLower = state.filters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (state.filters.status && state.filters.status !== 'all') {
      filtered = filtered.filter(project => project.status === state.filters.status);
    }
    
    if (state.filters.priority && state.filters.priority !== 'all') {
      filtered = filtered.filter(project => project.priority === state.filters.priority);
    }
    
    if (state.filters.teamId) {
      filtered = filtered.filter(project => project.team === state.filters.teamId);
    }
    
    return filtered;
  }, [state.projects, state.filters]);

  // Get user role in project
  const getUserRoleInProject = useCallback((projectId, userId = user?._id || user?.id) => {
    const project = state.projects.find(p => p._id === projectId);
    if (!project) return null;
    
    // Check multiple ID formats for compatibility
    const member = project.members?.find(m => {
      const memberId = m.user?._id || m.user?.id || m.user;
      return memberId === userId || memberId === user?._id || memberId === user?.id;
    });
    
    return member?.role || null;
  }, [state.projects, user]);

  // Check if user can perform action
  const canPerformAction = useCallback((projectId, action, userId = user?._id || user?.id) => {
    // First check if user is the project owner
    const project = state.projects.find(p => p._id === projectId);
    if (project) {
      const ownerId = project.owner?._id || project.owner?.id || project.owner;
      const currentUserId = userId || user?._id || user?.id;
      if (ownerId === currentUserId) {
        return true; // Owner has all permissions
      }
    }
    
    const role = getUserRoleInProject(projectId, userId);
    if (!role) return false;
    
    const permissions = {
      manager: ['all'],
      contributor: ['manage_tasks', 'view', 'create_tasks', 'update_tasks', 'view_project', 'add_comments'],
      viewer: ['view', 'view_project']
    };
    
    return permissions[role]?.includes(action) || permissions[role]?.includes('all');
  }, [getUserRoleInProject, user, state.projects]);

  // Auto-fetch projects when user changes (disabled to prevent infinite loops)
  // Projects are fetched manually from the Projects page
  // useEffect(() => {
  //   if (user && state.projects.length === 0) {
  //     fetchProjects({}, { showLoading: true, showErrors: false });
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [user]);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Computed values
    filteredProjects: getFilteredProjects(),
    
    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    addProjectMember,
    updateProjectMemberRole,
    removeProjectMember,
    fetchProjectTasks,
    createProjectTask,
    updateProjectTask,
    deleteProjectTask,
    fetchProjectStats,
    fetchProjectActivity,
    addMilestone,
    updateMilestoneStatus,
    archiveProject,
    setCurrentProject,
    clearCurrentProject,
    setFilters,
    setPagination,
    
    // Utilities
    getUserRoleInProject,
    canPerformAction,
    clearError
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;