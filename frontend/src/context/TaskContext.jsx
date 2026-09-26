import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from '../hooks/useNotification';

// Initial state
const initialState = {
  tasks: [],
  currentTask: null,
  loading: {
    tasks: false,
    currentTask: false,
    operations: false
  },
  errors: {
    tasks: null,
    currentTask: null,
    operations: null
  },
  filters: {
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all'
  }
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  REMOVE_TASK: 'REMOVE_TASK',
  SET_CURRENT_TASK: 'SET_CURRENT_TASK',
  CLEAR_CURRENT_TASK: 'CLEAR_CURRENT_TASK',
  SET_FILTERS: 'SET_FILTERS'
};

// Reducer function
function taskReducer(state, action) {
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

    case ActionTypes.SET_TASKS:
      return {
        ...state,
        tasks: action.payload.tasks,
        loading: {
          ...state.loading,
          tasks: false
        },
        errors: {
          ...state.errors,
          tasks: null
        }
      };

    case ActionTypes.ADD_TASK:
      return {
        ...state,
        tasks: [action.payload.task, ...state.tasks],
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task._id === action.payload.task._id ? action.payload.task : task
        ),
        currentTask: state.currentTask?._id === action.payload.task._id 
          ? action.payload.task 
          : state.currentTask,
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.REMOVE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task._id !== action.payload.taskId),
        currentTask: state.currentTask?._id === action.payload.taskId ? null : state.currentTask,
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.SET_CURRENT_TASK:
      return {
        ...state,
        currentTask: action.payload.task,
        loading: {
          ...state.loading,
          currentTask: false
        },
        errors: {
          ...state.errors,
          currentTask: null
        }
      };

    case ActionTypes.CLEAR_CURRENT_TASK:
      return {
        ...state,
        currentTask: null
      };

    case ActionTypes.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload.filters
        }
      };

    default:
      return state;
  }
}

// Create context
const TaskContext = createContext();

// Custom hook to use task context
export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

// Task provider component
export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
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

  // Placeholder functions for task operations
  // These would normally integrate with a task service
  const fetchTasks = useCallback(async (options = {}) => {
    setLoading('tasks', true);
    
    try {
      // TODO: Implement actual task fetching
      const mockTasks = [];
      
      dispatch({
        type: ActionTypes.SET_TASKS,
        payload: { tasks: mockTasks }
      });
      
      return { success: true, data: mockTasks };
    } catch (error) {
      const errorMessage = 'Failed to fetch tasks';
      setError('tasks', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  const createTask = useCallback(async (taskData) => {
    setLoading('operations', true);
    
    try {
      // TODO: Implement actual task creation
      const mockTask = {
        _id: Date.now().toString(),
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      dispatch({
        type: ActionTypes.ADD_TASK,
        payload: { task: mockTask }
      });
      
      showNotification({
        type: 'success',
        message: 'Task created successfully'
      });
      
      return { success: true, data: mockTask };
    } catch (error) {
      const errorMessage = 'Failed to create task';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  const updateTask = useCallback(async (taskId, updateData) => {
    setLoading('operations', true);
    
    try {
      // TODO: Implement actual task update
      const existingTask = state.tasks.find(t => t._id === taskId);
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      const updatedTask = {
        ...existingTask,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      dispatch({
        type: ActionTypes.UPDATE_TASK,
        payload: { task: updatedTask }
      });
      
      showNotification({
        type: 'success',
        message: 'Task updated successfully'
      });
      
      return { success: true, data: updatedTask };
    } catch (error) {
      const errorMessage = 'Failed to update task';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [state.tasks, setLoading, setError, showNotification]);

  const deleteTask = useCallback(async (taskId) => {
    setLoading('operations', true);
    
    try {
      // TODO: Implement actual task deletion
      dispatch({
        type: ActionTypes.REMOVE_TASK,
        payload: { taskId }
      });
      
      showNotification({
        type: 'success',
        message: 'Task deleted successfully'
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = 'Failed to delete task';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Set current task
  const setCurrentTask = useCallback((task) => {
    dispatch({
      type: ActionTypes.SET_CURRENT_TASK,
      payload: { task }
    });
  }, []);

  // Clear current task
  const clearCurrentTask = useCallback(() => {
    dispatch({
      type: ActionTypes.CLEAR_CURRENT_TASK
    });
  }, []);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({
      type: ActionTypes.SET_FILTERS,
      payload: { filters }
    });
  }, []);

  // Get filtered tasks
  const getFilteredTasks = useCallback(() => {
    let filtered = [...state.tasks];
    
    if (state.filters.search) {
      const searchLower = state.filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (state.filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === state.filters.status);
    }
    
    if (state.filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === state.filters.priority);
    }
    
    return filtered;
  }, [state.tasks, state.filters]);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Computed values
    filteredTasks: getFilteredTasks(),
    
    // Actions
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setCurrentTask,
    clearCurrentTask,
    setFilters,
    clearError
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext;