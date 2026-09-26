import React, { useEffect, useCallback, useRef } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { useTasks } from '../../context/TaskContext';
import { useNotification } from '../../hooks/useNotification';
import { dateUtils } from '../../utils/dateUtils';

/**
 * Component that handles seamless integration between calendar and existing task management workflows
 * This component ensures data consistency and synchronization across all views
 */
const CalendarTaskIntegration = () => {
  const {
    allTasks: calendarTasks,
    setAllTasks: setCalendarTasks,
    selectedTask,
    setSelectedTask,
    refreshTasks: refreshCalendarTasks
  } = useCalendar();

  const {
    tasks: taskManagerTasks,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: refreshTaskManagerTasks,
    isLoading: taskManagerLoading
  } = useTasks();

  const { showNotification } = useNotification();
  const syncInProgress = useRef(false);
  const lastSyncTime = useRef(Date.now());

  // Synchronize tasks between calendar and task manager
  const synchronizeTasks = useCallback(async () => {
    if (syncInProgress.current) return;
    
    syncInProgress.current = true;
    
    try {
      // Get the most recent tasks from both contexts
      const calendarTasksMap = new Map(calendarTasks.map(task => [task._id, task]));
      const taskManagerTasksMap = new Map(taskManagerTasks.map(task => [task._id, task]));
      
      // Find tasks that need to be synchronized
      const tasksToUpdate = [];
      const tasksToAdd = [];
      const tasksToRemove = [];
      
      // Check for updates from task manager to calendar
      taskManagerTasks.forEach(task => {
        const calendarTask = calendarTasksMap.get(task._id);
        if (!calendarTask) {
          tasksToAdd.push(task);
        } else if (new Date(task.updatedAt) > new Date(calendarTask.updatedAt)) {
          tasksToUpdate.push(task);
        }
      });
      
      // Check for tasks removed from task manager
      calendarTasks.forEach(task => {
        if (!taskManagerTasksMap.has(task._id)) {
          tasksToRemove.push(task._id);
        }
      });
      
      // Apply synchronization
      if (tasksToAdd.length > 0 || tasksToUpdate.length > 0 || tasksToRemove.length > 0) {
        let updatedCalendarTasks = [...calendarTasks];
        
        // Add new tasks
        tasksToAdd.forEach(task => {
          updatedCalendarTasks.push(task);
        });
        
        // Update existing tasks
        tasksToUpdate.forEach(updatedTask => {
          const index = updatedCalendarTasks.findIndex(t => t._id === updatedTask._id);
          if (index !== -1) {
            updatedCalendarTasks[index] = updatedTask;
          }
        });
        
        // Remove deleted tasks
        updatedCalendarTasks = updatedCalendarTasks.filter(
          task => !tasksToRemove.includes(task._id)
        );
        
        setCalendarTasks(updatedCalendarTasks);
        lastSyncTime.current = Date.now();
        
        // Show notification for significant changes
        const totalChanges = tasksToAdd.length + tasksToUpdate.length + tasksToRemove.length;
        if (totalChanges > 0) {
          showNotification({
            type: 'info',
            message: `Calendar synchronized: ${totalChanges} task${totalChanges !== 1 ? 's' : ''} updated`,
            duration: 3000
          });
        }
      }
    } catch (error) {
      //console.error('Failed to synchronize tasks:', error);
      showNotification({
        type: 'error',
        message: 'Failed to synchronize calendar with task manager',
        duration: 5000
      });
    } finally {
      syncInProgress.current = false;
    }
  }, [calendarTasks, taskManagerTasks, setCalendarTasks, showNotification]);

  // Handle task operations from calendar
  const handleCalendarTaskCreate = useCallback(async (taskData) => {
    try {
      // Ensure task has calendar-specific fields
      const calendarTaskData = {
        ...taskData,
        createdFrom: 'calendar',
        calendarMetadata: {
          createdAt: new Date().toISOString(),
          viewContext: 'calendar'
        }
      };
      
      const newTask = await createTask(calendarTaskData);
      
      // Update calendar immediately for better UX
      setCalendarTasks(prev => [...prev, newTask]);
      
      showNotification({
        type: 'success',
        message: 'Task created successfully',
        duration: 3000
      });
      
      return newTask;
    } catch (error) {
      //console.error('Failed to create task from calendar:', error);
      showNotification({
        type: 'error',
        message: 'Failed to create task',
        duration: 5000
      });
      throw error;
    }
  }, [createTask, setCalendarTasks, showNotification]);

  const handleCalendarTaskUpdate = useCallback(async (taskId, updates) => {
    try {
      // Add calendar-specific metadata
      const calendarUpdates = {
        ...updates,
        lastModifiedFrom: 'calendar',
        lastModifiedAt: new Date().toISOString()
      };
      
      const updatedTask = await updateTask(taskId, calendarUpdates);
      
      // Update calendar immediately
      setCalendarTasks(prev => 
        prev.map(task => task._id === taskId ? updatedTask : task)
      );
      
      showNotification({
        type: 'success',
        message: 'Task updated successfully',
        duration: 3000
      });
      
      return updatedTask;
    } catch (error) {
      //console.error('Failed to update task from calendar:', error);
      showNotification({
        type: 'error',
        message: 'Failed to update task',
        duration: 5000
      });
      throw error;
    }
  }, [updateTask, setCalendarTasks, showNotification]);

  const handleCalendarTaskDelete = useCallback(async (taskId) => {
    try {
      await deleteTask(taskId);
      
      // Update calendar immediately
      setCalendarTasks(prev => prev.filter(task => task._id !== taskId));
      
      // Clear selection if deleted task was selected
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask(null);
      }
      
      showNotification({
        type: 'success',
        message: 'Task deleted successfully',
        duration: 3000
      });
    } catch (error) {
      //console.error('Failed to delete task from calendar:', error);
      showNotification({
        type: 'error',
        message: 'Failed to delete task',
        duration: 5000
      });
      throw error;
    }
  }, [deleteTask, setCalendarTasks, selectedTask, setSelectedTask, showNotification]);

  // Handle bulk operations
  const handleBulkTaskUpdate = useCallback(async (taskIds, updates) => {
    try {
      const updatePromises = taskIds.map(taskId => 
        handleCalendarTaskUpdate(taskId, updates)
      );
      
      await Promise.all(updatePromises);
      
      showNotification({
        type: 'success',
        message: `${taskIds.length} tasks updated successfully`,
        duration: 3000
      });
    } catch (error) {
      //console.error('Failed to bulk update tasks:', error);
      showNotification({
        type: 'error',
        message: 'Failed to update some tasks',
        duration: 5000
      });
    }
  }, [handleCalendarTaskUpdate, showNotification]);

  // Validate task data consistency
  const validateTaskConsistency = useCallback(() => {
    const inconsistencies = [];
    
    calendarTasks.forEach(calendarTask => {
      const taskManagerTask = taskManagerTasks.find(t => t._id === calendarTask._id);
      
      if (taskManagerTask) {
        // Check for data inconsistencies
        const criticalFields = ['title', 'status', 'priority', 'due'];
        criticalFields.forEach(field => {
          if (calendarTask[field] !== taskManagerTask[field]) {
            inconsistencies.push({
              taskId: calendarTask._id,
              field,
              calendarValue: calendarTask[field],
              taskManagerValue: taskManagerTask[field]
            });
          }
        });
      }
    });
    
    if (inconsistencies.length > 0) {
      //console.warn('Task data inconsistencies detected:', inconsistencies);
      // Trigger synchronization to resolve inconsistencies
      synchronizeTasks();
    }
    
    return inconsistencies;
  }, [calendarTasks, taskManagerTasks, synchronizeTasks]);

  // Handle task status changes with calendar-specific logic
  const handleTaskStatusChange = useCallback(async (taskId, newStatus, context = {}) => {
    try {
      const task = calendarTasks.find(t => t._id === taskId);
      if (!task) return;
      
      const updates = {
        status: newStatus,
        statusChangedFrom: 'calendar',
        statusChangedAt: new Date().toISOString(),
        ...context
      };
      
      // Add completion date for completed tasks
      if (newStatus === 'completed' && task.status !== 'completed') {
        updates.completedAt = new Date().toISOString();
        updates.completedFrom = 'calendar';
      }
      
      // Clear completion date for non-completed tasks
      if (newStatus !== 'completed' && task.status === 'completed') {
        updates.completedAt = null;
      }
      
      await handleCalendarTaskUpdate(taskId, updates);
      
      // Show appropriate notification
      const statusMessages = {
        'pending': 'Task marked as pending',
        'in-progress': 'Task marked as in progress',
        'completed': 'Task completed! 🎉',
        'cancelled': 'Task cancelled'
      };
      
      showNotification({
        type: newStatus === 'completed' ? 'success' : 'info',
        message: statusMessages[newStatus] || 'Task status updated',
        duration: 3000
      });
      
    } catch (error) {
      //console.error('Failed to update task status:', error);
      showNotification({
        type: 'error',
        message: 'Failed to update task status',
        duration: 5000
      });
    }
  }, [calendarTasks, handleCalendarTaskUpdate, showNotification]);

  // Handle task date/time changes with validation
  const handleTaskDateChange = useCallback(async (taskId, newDate, context = {}) => {
    try {
      const task = calendarTasks.find(t => t._id === taskId);
      if (!task) return;
      
      // Validate date change
      const now = new Date();
      const dateToSet = new Date(newDate);
      
      if (isNaN(dateToSet.getTime())) {
        throw new Error('Invalid date provided');
      }
      
      const updates = {
        due: dateToSet.toISOString(),
        dateChangedFrom: 'calendar',
        dateChangedAt: now.toISOString(),
        ...context
      };
      
      // Add warning for past dates
      if (dateToSet < now && task.status !== 'completed') {
        updates.isOverdue = true;
      } else {
        updates.isOverdue = false;
      }
      
      await handleCalendarTaskUpdate(taskId, updates);
      
      const isMovingToPast = dateToSet < now;
      showNotification({
        type: isMovingToPast ? 'warning' : 'success',
        message: isMovingToPast 
          ? 'Task moved to past date - marked as overdue'
          : `Task rescheduled to ${dateUtils.formatDate(dateToSet)}`,
        duration: 3000
      });
      
    } catch (error) {
      //console.error('Failed to update task date:', error);
      showNotification({
        type: 'error',
        message: 'Failed to update task date',
        duration: 5000
      });
    }
  }, [calendarTasks, handleCalendarTaskUpdate, showNotification]);

  // Periodic synchronization
  useEffect(() => {
    const syncInterval = setInterval(() => {
      // Only sync if it's been more than 30 seconds since last sync
      if (Date.now() - lastSyncTime.current > 30000) {
        synchronizeTasks();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(syncInterval);
  }, [synchronizeTasks]);

  // Initial synchronization when component mounts
  useEffect(() => {
    if (!taskManagerLoading) {
      synchronizeTasks();
    }
  }, [taskManagerLoading, synchronizeTasks]);

  // Validate consistency periodically
  useEffect(() => {
    const validationInterval = setInterval(() => {
      validateTaskConsistency();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(validationInterval);
  }, [validateTaskConsistency]);

  // Expose integration methods to calendar context
  useEffect(() => {
    // Add integration methods to calendar context if available
    if (window.calendarIntegration) {
      window.calendarIntegration = {
        createTask: handleCalendarTaskCreate,
        updateTask: handleCalendarTaskUpdate,
        deleteTask: handleCalendarTaskDelete,
        bulkUpdate: handleBulkTaskUpdate,
        changeStatus: handleTaskStatusChange,
        changeDate: handleTaskDateChange,
        synchronize: synchronizeTasks,
        validateConsistency: validateTaskConsistency
      };
    }
  }, [
    handleCalendarTaskCreate,
    handleCalendarTaskUpdate,
    handleCalendarTaskDelete,
    handleBulkTaskUpdate,
    handleTaskStatusChange,
    handleTaskDateChange,
    synchronizeTasks,
    validateTaskConsistency
  ]);

  // This component doesn't render anything - it's purely for integration logic
  return null;
};

export default CalendarTaskIntegration;