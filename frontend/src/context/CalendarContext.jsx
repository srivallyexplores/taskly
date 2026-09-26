import React, { createContext, useContext, useReducer, useCallback } from 'react';
import calendarService from '../services/calendarService';
import { useNotification } from '../hooks/useNotification';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfDay,
  endOfDay,
  format 
} from 'date-fns';

// Initial state
const initialState = {
  currentView: 'month', // month, week, day, agenda
  currentDate: new Date(),
  selectedDate: null,
  dateRange: {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  },
  
  // Task data organized by date
  tasks: [],
  tasksByDate: {},
  
  // UI state
  loading: {
    events: false,
    operations: false
  },
  errors: {
    events: null,
    operations: null
  },
  
  // Drag and drop state
  draggedTask: null,
  
  // Filters
  filters: {
    priority: 'all',
    status: 'all',
    tags: []
  }
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  SET_VIEW: 'SET_VIEW',
  SET_CURRENT_DATE: 'SET_CURRENT_DATE',
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  SET_DATE_RANGE: 'SET_DATE_RANGE',
  
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  REMOVE_TASK: 'REMOVE_TASK',
  
  SET_DRAGGED_TASK: 'SET_DRAGGED_TASK',
  CLEAR_DRAGGED_TASK: 'CLEAR_DRAGGED_TASK',
  
  SET_FILTERS: 'SET_FILTERS'
};

// Reducer
function calendarReducer(state, action) {
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

    case ActionTypes.SET_VIEW:
      return {
        ...state,
        currentView: action.payload.view
      };

    case ActionTypes.SET_CURRENT_DATE:
      return {
        ...state,
        currentDate: action.payload.date
      };

    case ActionTypes.SET_SELECTED_DATE:
      return {
        ...state,
        selectedDate: action.payload.date
      };

    case ActionTypes.SET_DATE_RANGE:
      return {
        ...state,
        dateRange: action.payload.range
      };

    case ActionTypes.SET_TASKS:
      return {
        ...state,
        tasks: action.payload.tasks,
        tasksByDate: organizeTasksByDate(action.payload.tasks),
        loading: {
          ...state.loading,
          events: false
        },
        errors: {
          ...state.errors,
          events: null
        }
      };

    case ActionTypes.ADD_TASK:
      const newTasks = [action.payload.task, ...state.tasks];
      return {
        ...state,
        tasks: newTasks,
        tasksByDate: organizeTasksByDate(newTasks),
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.UPDATE_TASK:
      const updatedTasks = state.tasks.map(task =>
        task._id === action.payload.task._id ? action.payload.task : task
      );
      return {
        ...state,
        tasks: updatedTasks,
        tasksByDate: organizeTasksByDate(updatedTasks),
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.REMOVE_TASK:
      const filteredTasks = state.tasks.filter(task => task._id !== action.payload.taskId);
      return {
        ...state,
        tasks: filteredTasks,
        tasksByDate: organizeTasksByDate(filteredTasks),
        loading: {
          ...state.loading,
          operations: false
        }
      };

    case ActionTypes.SET_DRAGGED_TASK:
      return {
        ...state,
        draggedTask: action.payload.task
      };

    case ActionTypes.CLEAR_DRAGGED_TASK:
      return {
        ...state,
        draggedTask: null
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

// Helper function to organize tasks by date
function organizeTasksByDate(tasks) {
  const tasksByDate = {};
  
  tasks.forEach(task => {
    if (task.due) {
      const dateKey = format(new Date(task.due), 'yyyy-MM-dd');
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    }
  });
  
  return tasksByDate;
}

// Create context
const CalendarContext = createContext();

// Custom hook
export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

// Calendar provider
export const CalendarProvider = ({ children }) => {
  const [state, dispatch] = useReducer(calendarReducer, initialState);
  const { showNotification } = useNotification();

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

  // Calculate date range based on view and current date
  const calculateDateRange = useCallback((date, view) => {
    let start, end;
    
    switch (view) {
      case 'week':
        start = startOfWeek(date);
        end = endOfWeek(date);
        break;
      case 'day':
        start = startOfDay(date);
        end = endOfDay(date);
        break;
      case 'month':
      default:
        start = startOfMonth(date);
        end = endOfMonth(date);
        break;
    }
    
    return { start, end };
  }, []);

  // Fetch calendar events
  const fetchEvents = useCallback(async (options = {}) => {
    const { date = state.currentDate, view = state.currentView } = options;
    
    setLoading('events', true);
    
    try {
      const range = calculateDateRange(date, view);
      
      const result = await calendarService.getEvents({
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
        view
      });
      
      if (result.success) {
        dispatch({
          type: ActionTypes.SET_TASKS,
          payload: { tasks: result.data.tasks || [] }
        });
        
        dispatch({
          type: ActionTypes.SET_DATE_RANGE,
          payload: { range }
        });
        
        return result;
      } else {
        setError('events', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch calendar events';
      setError('events', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [state.currentDate, state.currentView, calculateDateRange, setLoading, setError, showNotification]);

  // Set calendar view
  const setView = useCallback(async (view) => {
    dispatch({
      type: ActionTypes.SET_VIEW,
      payload: { view }
    });
    
    // Fetch events for new view
    await fetchEvents({ view });
  }, [fetchEvents]);

  // Navigate to date
  const navigateToDate = useCallback(async (date) => {
    dispatch({
      type: ActionTypes.SET_CURRENT_DATE,
      payload: { date }
    });
    
    // Fetch events for new date
    await fetchEvents({ date });
  }, [fetchEvents]);

  // Navigate to today
  const navigateToToday = useCallback(async () => {
    const today = new Date();
    await navigateToDate(today);
  }, [navigateToDate]);

  // Navigate to previous period
  const navigatePrevious = useCallback(async () => {
    let newDate;
    
    switch (state.currentView) {
      case 'week':
        newDate = new Date(state.currentDate);
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate = new Date(state.currentDate);
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'month':
      default:
        newDate = new Date(state.currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    
    await navigateToDate(newDate);
  }, [state.currentDate, state.currentView, navigateToDate]);

  // Navigate to next period
  const navigateNext = useCallback(async () => {
    let newDate;
    
    switch (state.currentView) {
      case 'week':
        newDate = new Date(state.currentDate);
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate = new Date(state.currentDate);
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'month':
      default:
        newDate = new Date(state.currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    
    await navigateToDate(newDate);
  }, [state.currentDate, state.currentView, navigateToDate]);

  // Select date
  const selectDate = useCallback((date) => {
    dispatch({
      type: ActionTypes.SET_SELECTED_DATE,
      payload: { date }
    });
  }, []);

  // Create task from calendar
  const createTask = useCallback(async (taskData) => {
    setLoading('operations', true);
    
    try {
      const result = await calendarService.createTask(taskData);
      
      if (result.success) {
        dispatch({
          type: ActionTypes.ADD_TASK,
          payload: { task: result.data }
        });
        
        showNotification({
          type: 'success',
          message: 'Task created successfully'
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
      const errorMessage = 'Failed to create task';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [setLoading, setError, showNotification]);

  // Update task date (drag and drop)
  const updateTaskDate = useCallback(async (taskId, newDate) => {
    setLoading('operations', true);
    
    // Store original task for rollback
    const originalTask = state.tasks.find(t => t._id === taskId);
    
    // Optimistic update
    const optimisticTask = { ...originalTask, due: newDate };
    dispatch({
      type: ActionTypes.UPDATE_TASK,
      payload: { task: optimisticTask }
    });
    
    try {
      const result = await calendarService.updateTaskDate(taskId, newDate.toISOString());
      
      if (result.success) {
        dispatch({
          type: ActionTypes.UPDATE_TASK,
          payload: { task: result.data }
        });
        
        showNotification({
          type: 'success',
          message: 'Task date updated'
        });
        
        return result;
      } else {
        // Rollback on failure
        dispatch({
          type: ActionTypes.UPDATE_TASK,
          payload: { task: originalTask }
        });
        
        setError('operations', result.message);
        showNotification({
          type: 'error',
          message: result.message
        });
        return result;
      }
    } catch (error) {
      // Rollback on error
      dispatch({
        type: ActionTypes.UPDATE_TASK,
        payload: { task: originalTask }
      });
      
      const errorMessage = 'Failed to update task date';
      setError('operations', errorMessage);
      showNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  }, [state.tasks, setLoading, setError, showNotification]);

  // Set dragged task
  const setDraggedTask = useCallback((task) => {
    dispatch({
      type: ActionTypes.SET_DRAGGED_TASK,
      payload: { task }
    });
  }, []);

  // Clear dragged task
  const clearDraggedTask = useCallback(() => {
    dispatch({
      type: ActionTypes.CLEAR_DRAGGED_TASK
    });
  }, []);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({
      type: ActionTypes.SET_FILTERS,
      payload: { filters }
    });
  }, []);

  // Get tasks for specific date
  const getTasksForDate = useCallback((date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return state.tasksByDate[dateKey] || [];
  }, [state.tasksByDate]);

  // Get filtered tasks
  const getFilteredTasks = useCallback(() => {
    let filtered = [...state.tasks];
    
    if (state.filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === state.filters.priority);
    }
    
    if (state.filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === state.filters.status);
    }
    
    if (state.filters.tags.length > 0) {
      filtered = filtered.filter(task =>
        task.tags && task.tags.some(tag => state.filters.tags.includes(tag))
      );
    }
    
    return filtered;
  }, [state.tasks, state.filters]);

  const value = {
    // State
    ...state,
    
    // Computed
    filteredTasks: getFilteredTasks(),
    
    // Actions
    fetchEvents,
    setView,
    navigateToDate,
    navigateToToday,
    navigatePrevious,
    navigateNext,
    selectDate,
    createTask,
    updateTaskDate,
    setDraggedTask,
    clearDraggedTask,
    setFilters,
    getTasksForDate,
    clearError
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

export default CalendarContext;
