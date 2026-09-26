import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { useAnalytics } from './AnalyticsContext';

// Initial state
const initialState = {
  // UI State
  sidebarCollapsed: false,
  globalSearchOpen: false,
  quickActionsOpen: false,
  
  // Modal States
  taskCreateModalOpen: false,
  taskEditModalOpen: false,
  projectCreateModalOpen: false,
  settingsModalOpen: false,
  
  // Data States
  tasks: [],
  projects: [],
  teams: [],
  achievements: [],
  
  // Loading States
  tasksLoading: false,
  projectsLoading: false,
  teamsLoading: false,
  achievementsLoading: false,
  
  // Filter and Search States
  taskFilters: {
    status: 'all',
    priority: 'all',
    assignee: 'all',
    project: 'all',
    tags: [],
    dateRange: null
  },
  searchQuery: '',
  sortBy: 'dueDate',
  sortOrder: 'asc',
  
  // View States
  currentView: 'list', // list, board, calendar, timeline
  selectedTasks: [],
  
  // Gamification States
  userLevel: 1,
  userExperience: 0,
  streakCount: 0,
  unlockedAchievements: [],
  
  // Collaboration States
  activeTeam: null,
  teamMembers: [],
  notifications: [],
  
  // Performance States
  lastSync: null,
  offlineMode: false,
  syncInProgress: false
};

// Action types
const APP_ACTIONS = {
  // UI Actions
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_GLOBAL_SEARCH: 'SET_GLOBAL_SEARCH',
  SET_QUICK_ACTIONS: 'SET_QUICK_ACTIONS',
  
  // Modal Actions
  SET_TASK_CREATE_MODAL: 'SET_TASK_CREATE_MODAL',
  SET_TASK_EDIT_MODAL: 'SET_TASK_EDIT_MODAL',
  SET_PROJECT_CREATE_MODAL: 'SET_PROJECT_CREATE_MODAL',
  SET_SETTINGS_MODAL: 'SET_SETTINGS_MODAL',
  
  // Data Actions
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  SET_PROJECTS: 'SET_PROJECTS',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  SET_TEAMS: 'SET_TEAMS',
  SET_ACHIEVEMENTS: 'SET_ACHIEVEMENTS',
  
  // Loading Actions
  SET_TASKS_LOADING: 'SET_TASKS_LOADING',
  SET_PROJECTS_LOADING: 'SET_PROJECTS_LOADING',
  SET_TEAMS_LOADING: 'SET_TEAMS_LOADING',
  SET_ACHIEVEMENTS_LOADING: 'SET_ACHIEVEMENTS_LOADING',
  
  // Filter and Search Actions
  SET_TASK_FILTERS: 'SET_TASK_FILTERS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SORT: 'SET_SORT',
  
  // View Actions
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_SELECTED_TASKS: 'SET_SELECTED_TASKS',
  TOGGLE_TASK_SELECTION: 'TOGGLE_TASK_SELECTION',
  CLEAR_TASK_SELECTION: 'CLEAR_TASK_SELECTION',
  
  // Gamification Actions
  UPDATE_USER_STATS: 'UPDATE_USER_STATS',
  UNLOCK_ACHIEVEMENT: 'UNLOCK_ACHIEVEMENT',
  
  // Collaboration Actions
  SET_ACTIVE_TEAM: 'SET_ACTIVE_TEAM',
  SET_TEAM_MEMBERS: 'SET_TEAM_MEMBERS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  
  // Performance Actions
  SET_LAST_SYNC: 'SET_LAST_SYNC',
  SET_OFFLINE_MODE: 'SET_OFFLINE_MODE',
  SET_SYNC_IN_PROGRESS: 'SET_SYNC_IN_PROGRESS'
};

// Reducer
const appStateReducer = (state, action) => {
  switch (action.type) {
    // UI Actions
    case APP_ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case APP_ACTIONS.SET_GLOBAL_SEARCH:
      return { ...state, globalSearchOpen: action.payload };
    case APP_ACTIONS.SET_QUICK_ACTIONS:
      return { ...state, quickActionsOpen: action.payload };
    
    // Modal Actions
    case APP_ACTIONS.SET_TASK_CREATE_MODAL:
      return { ...state, taskCreateModalOpen: action.payload };
    case APP_ACTIONS.SET_TASK_EDIT_MODAL:
      return { ...state, taskEditModalOpen: action.payload };
    case APP_ACTIONS.SET_PROJECT_CREATE_MODAL:
      return { ...state, projectCreateModalOpen: action.payload };
    case APP_ACTIONS.SET_SETTINGS_MODAL:
      return { ...state, settingsModalOpen: action.payload };
    
    // Data Actions
    case APP_ACTIONS.SET_TASKS:
      return { ...state, tasks: action.payload };
    case APP_ACTIONS.ADD_TASK:
      return { ...state, tasks: [...state.tasks, action.payload] };
    case APP_ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload } : task
        )
      };
    case APP_ACTIONS.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case APP_ACTIONS.SET_PROJECTS:
      return { ...state, projects: action.payload };
    case APP_ACTIONS.ADD_PROJECT:
      return { ...state, projects: [...state.projects, action.payload] };
    case APP_ACTIONS.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? { ...project, ...action.payload } : project
        )
      };
    case APP_ACTIONS.DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload)
      };
    case APP_ACTIONS.SET_TEAMS:
      return { ...state, teams: action.payload };
    case APP_ACTIONS.SET_ACHIEVEMENTS:
      return { ...state, achievements: action.payload };
    
    // Loading Actions
    case APP_ACTIONS.SET_TASKS_LOADING:
      return { ...state, tasksLoading: action.payload };
    case APP_ACTIONS.SET_PROJECTS_LOADING:
      return { ...state, projectsLoading: action.payload };
    case APP_ACTIONS.SET_TEAMS_LOADING:
      return { ...state, teamsLoading: action.payload };
    case APP_ACTIONS.SET_ACHIEVEMENTS_LOADING:
      return { ...state, achievementsLoading: action.payload };
    
    // Filter and Search Actions
    case APP_ACTIONS.SET_TASK_FILTERS:
      return { ...state, taskFilters: { ...state.taskFilters, ...action.payload } };
    case APP_ACTIONS.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };
    case APP_ACTIONS.SET_SORT:
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
    
    // View Actions
    case APP_ACTIONS.SET_CURRENT_VIEW:
      return { ...state, currentView: action.payload };
    case APP_ACTIONS.SET_SELECTED_TASKS:
      return { ...state, selectedTasks: action.payload };
    case APP_ACTIONS.TOGGLE_TASK_SELECTION:
      const taskId = action.payload;
      const isSelected = state.selectedTasks.includes(taskId);
      return {
        ...state,
        selectedTasks: isSelected
          ? state.selectedTasks.filter(id => id !== taskId)
          : [...state.selectedTasks, taskId]
      };
    case APP_ACTIONS.CLEAR_TASK_SELECTION:
      return { ...state, selectedTasks: [] };
    
    // Gamification Actions
    case APP_ACTIONS.UPDATE_USER_STATS:
      return {
        ...state,
        userLevel: action.payload.level || state.userLevel,
        userExperience: action.payload.experience || state.userExperience,
        streakCount: action.payload.streakCount || state.streakCount
      };
    case APP_ACTIONS.UNLOCK_ACHIEVEMENT:
      return {
        ...state,
        unlockedAchievements: [...state.unlockedAchievements, action.payload]
      };
    
    // Collaboration Actions
    case APP_ACTIONS.SET_ACTIVE_TEAM:
      return { ...state, activeTeam: action.payload };
    case APP_ACTIONS.SET_TEAM_MEMBERS:
      return { ...state, teamMembers: action.payload };
    case APP_ACTIONS.ADD_NOTIFICATION:
      return { ...state, notifications: [...state.notifications, action.payload] };
    case APP_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    // Performance Actions
    case APP_ACTIONS.SET_LAST_SYNC:
      return { ...state, lastSync: action.payload };
    case APP_ACTIONS.SET_OFFLINE_MODE:
      return { ...state, offlineMode: action.payload };
    case APP_ACTIONS.SET_SYNC_IN_PROGRESS:
      return { ...state, syncInProgress: action.payload };
    
    default:
      return state;
  }
};

// Create context
const AppStateContext = createContext();

// Provider component
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { onTaskCompleted, onTaskCreated, onTaskUpdated, onTaskDeleted } = useAnalytics();

  // Sync with analytics when tasks change
  useEffect(() => {
    // Register analytics listeners for task events
    const handleTaskEvent = (eventType, taskData) => {
      switch (eventType) {
        case 'TASK_COMPLETED':
          // Update user stats for gamification
          dispatch({
            type: APP_ACTIONS.UPDATE_USER_STATS,
            payload: {
              experience: state.userExperience + 10,
              streakCount: state.streakCount + 1
            }
          });
          showSuccess('Task completed! +10 XP');
          break;
        case 'TASK_CREATED':
          showSuccess('Task created successfully');
          break;
        case 'TASK_UPDATED':
          showSuccess('Task updated successfully');
          break;
        case 'TASK_DELETED':
          showSuccess('Task deleted successfully');
          break;
        default:
          break;
      }
    };

    // This would be registered with analytics context
    // For now, we'll handle it locally
  }, [state.userExperience, state.streakCount, showSuccess, showError]);

  // Action creators
  const actions = {
    // UI Actions
    toggleSidebar: () => dispatch({ type: APP_ACTIONS.TOGGLE_SIDEBAR }),
    setGlobalSearch: (open) => dispatch({ type: APP_ACTIONS.SET_GLOBAL_SEARCH, payload: open }),
    setQuickActions: (open) => dispatch({ type: APP_ACTIONS.SET_QUICK_ACTIONS, payload: open }),
    
    // Modal Actions
    setTaskCreateModal: (open) => dispatch({ type: APP_ACTIONS.SET_TASK_CREATE_MODAL, payload: open }),
    setTaskEditModal: (open) => dispatch({ type: APP_ACTIONS.SET_TASK_EDIT_MODAL, payload: open }),
    setProjectCreateModal: (open) => dispatch({ type: APP_ACTIONS.SET_PROJECT_CREATE_MODAL, payload: open }),
    setSettingsModal: (open) => dispatch({ type: APP_ACTIONS.SET_SETTINGS_MODAL, payload: open }),
    
    // Data Actions
    setTasks: (tasks) => dispatch({ type: APP_ACTIONS.SET_TASKS, payload: tasks }),
    addTask: (task) => {
      dispatch({ type: APP_ACTIONS.ADD_TASK, payload: task });
      onTaskCreated(task);
    },
    updateTask: (task) => {
      dispatch({ type: APP_ACTIONS.UPDATE_TASK, payload: task });
      onTaskUpdated(task);
      
      // Check if task was completed
      if (task.status === 'completed') {
        onTaskCompleted(task);
      }
    },
    deleteTask: (taskId) => {
      const task = state.tasks.find(t => t.id === taskId);
      dispatch({ type: APP_ACTIONS.DELETE_TASK, payload: taskId });
      if (task) {
        onTaskDeleted(task);
      }
    },
    setProjects: (projects) => dispatch({ type: APP_ACTIONS.SET_PROJECTS, payload: projects }),
    addProject: (project) => dispatch({ type: APP_ACTIONS.ADD_PROJECT, payload: project }),
    updateProject: (project) => dispatch({ type: APP_ACTIONS.UPDATE_PROJECT, payload: project }),
    deleteProject: (projectId) => dispatch({ type: APP_ACTIONS.DELETE_PROJECT, payload: projectId }),
    
    // Loading Actions
    setTasksLoading: (loading) => dispatch({ type: APP_ACTIONS.SET_TASKS_LOADING, payload: loading }),
    setProjectsLoading: (loading) => dispatch({ type: APP_ACTIONS.SET_PROJECTS_LOADING, payload: loading }),
    
    // Filter and Search Actions
    setTaskFilters: (filters) => dispatch({ type: APP_ACTIONS.SET_TASK_FILTERS, payload: filters }),
    setSearchQuery: (query) => dispatch({ type: APP_ACTIONS.SET_SEARCH_QUERY, payload: query }),
    setSort: (sortBy, sortOrder) => dispatch({ type: APP_ACTIONS.SET_SORT, payload: { sortBy, sortOrder } }),
    
    // View Actions
    setCurrentView: (view) => dispatch({ type: APP_ACTIONS.SET_CURRENT_VIEW, payload: view }),
    setSelectedTasks: (taskIds) => dispatch({ type: APP_ACTIONS.SET_SELECTED_TASKS, payload: taskIds }),
    toggleTaskSelection: (taskId) => dispatch({ type: APP_ACTIONS.TOGGLE_TASK_SELECTION, payload: taskId }),
    clearTaskSelection: () => dispatch({ type: APP_ACTIONS.CLEAR_TASK_SELECTION }),
    
    // Gamification Actions
    updateUserStats: (stats) => dispatch({ type: APP_ACTIONS.UPDATE_USER_STATS, payload: stats }),
    unlockAchievement: (achievement) => {
      dispatch({ type: APP_ACTIONS.UNLOCK_ACHIEVEMENT, payload: achievement });
      showSuccess(`Achievement unlocked: ${achievement.name}!`);
    },
    
    // Collaboration Actions
    setActiveTeam: (team) => dispatch({ type: APP_ACTIONS.SET_ACTIVE_TEAM, payload: team }),
    setTeamMembers: (members) => dispatch({ type: APP_ACTIONS.SET_TEAM_MEMBERS, payload: members }),
    
    // Performance Actions
    setLastSync: (timestamp) => dispatch({ type: APP_ACTIONS.SET_LAST_SYNC, payload: timestamp }),
    setOfflineMode: (offline) => dispatch({ type: APP_ACTIONS.SET_OFFLINE_MODE, payload: offline }),
    setSyncInProgress: (syncing) => dispatch({ type: APP_ACTIONS.SET_SYNC_IN_PROGRESS, payload: syncing })
  };

  // Computed values
  const computed = {
    filteredTasks: state.tasks.filter(task => {
      const { status, priority, assignee, project, tags, dateRange } = state.taskFilters;
      const { searchQuery } = state;
      
      // Status filter
      if (status !== 'all' && task.status !== status) return false;
      
      // Priority filter
      if (priority !== 'all' && task.priority !== priority) return false;
      
      // Assignee filter
      if (assignee !== 'all' && task.assigneeId !== assignee) return false;
      
      // Project filter
      if (project !== 'all' && task.projectId !== project) return false;
      
      // Tags filter
      if (tags.length > 0 && !tags.some(tag => task.tags?.includes(tag))) return false;
      
      // Date range filter
      if (dateRange && task.dueDate) {
        const taskDate = new Date(task.dueDate);
        if (taskDate < dateRange.start || taskDate > dateRange.end) return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          task.title,
          task.description,
          ...(task.tags || [])
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }
      
      return true;
    }),
    
    selectedTasksData: state.selectedTasks.map(id => 
      state.tasks.find(task => task.id === id)
    ).filter(Boolean),
    
    taskStats: {
      total: state.tasks.length,
      completed: state.tasks.filter(t => t.status === 'completed').length,
      inProgress: state.tasks.filter(t => t.status === 'in-progress').length,
      todo: state.tasks.filter(t => t.status === 'todo').length,
      overdue: state.tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date();
      }).length
    },
    
    isLoading: state.tasksLoading || state.projectsLoading || state.teamsLoading || state.achievementsLoading
  };

  const value = {
    // State
    ...state,
    
    // Actions
    ...actions,
    
    // Computed values
    ...computed
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Custom hook
export const useAppState = () => {
  const context = useContext(AppStateContext);
  
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  
  return context;
};

export default AppStateContext;