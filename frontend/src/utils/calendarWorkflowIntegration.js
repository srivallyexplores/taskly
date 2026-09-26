import { dateUtils } from './dateUtils';

/**
 * Utility functions for integrating calendar with existing task management workflows
 */

// Task workflow states and transitions
export const TASK_WORKFLOWS = {
  STANDARD: {
    name: 'Standard Workflow',
    states: ['pending', 'in-progress', 'completed', 'cancelled'],
    transitions: {
      'pending': ['in-progress', 'completed', 'cancelled'],
      'in-progress': ['pending', 'completed', 'cancelled'],
      'completed': ['pending', 'in-progress'],
      'cancelled': ['pending', 'in-progress']
    }
  },
  AGILE: {
    name: 'Agile Workflow',
    states: ['backlog', 'todo', 'in-progress', 'review', 'done'],
    transitions: {
      'backlog': ['todo'],
      'todo': ['in-progress', 'backlog'],
      'in-progress': ['review', 'todo'],
      'review': ['done', 'in-progress'],
      'done': ['todo']
    }
  },
  KANBAN: {
    name: 'Kanban Workflow',
    states: ['todo', 'doing', 'done'],
    transitions: {
      'todo': ['doing'],
      'doing': ['done', 'todo'],
      'done': ['doing']
    }
  }
};

// Calendar-specific task operations
export const calendarWorkflowIntegration = {
  
  /**
   * Validate task workflow transition
   */
  validateWorkflowTransition(currentStatus, newStatus, workflow = 'STANDARD') {
    const workflowConfig = TASK_WORKFLOWS[workflow];
    if (!workflowConfig) {
      ////console.warn(`Unknown workflow: ${workflow}`);
      return true; // Allow transition if workflow is unknown
    }
    
    const allowedTransitions = workflowConfig.transitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  },

  /**
   * Get next possible states for a task
   */
  getNextStates(currentStatus, workflow = 'STANDARD') {
    const workflowConfig = TASK_WORKFLOWS[workflow];
    if (!workflowConfig) return [];
    
    return workflowConfig.transitions[currentStatus] || [];
  },

  /**
   * Process task creation from calendar context
   */
  processCalendarTaskCreation(taskData, calendarContext) {
    const processedTask = {
      ...taskData,
      // Add calendar-specific metadata
      createdFrom: 'calendar',
      calendarContext: {
        view: calendarContext.currentView,
        date: calendarContext.currentDate,
        createdAt: new Date().toISOString()
      },
      // Ensure required fields
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      // Set due date based on calendar context if not provided
      due: taskData.due || calendarContext.selectedDate || calendarContext.currentDate
    };

    // Add time-based defaults
    if (!taskData.due && calendarContext.selectedTimeSlot) {
      const dueDate = new Date(calendarContext.selectedDate || calendarContext.currentDate);
      const [hours, minutes] = calendarContext.selectedTimeSlot.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      processedTask.due = dueDate.toISOString();
    }

    return processedTask;
  },

  /**
   * Process task updates from calendar interactions
   */
  processCalendarTaskUpdate(taskId, updates, calendarContext, originalTask) {
    const processedUpdates = {
      ...updates,
      // Add update metadata
      lastModifiedFrom: 'calendar',
      lastModifiedAt: new Date().toISOString(),
      calendarUpdateContext: {
        view: calendarContext.currentView,
        action: calendarContext.lastAction,
        timestamp: new Date().toISOString()
      }
    };

    // Handle date changes
    if (updates.due && updates.due !== originalTask.due) {
      processedUpdates.dateChangeHistory = [
        ...(originalTask.dateChangeHistory || []),
        {
          from: originalTask.due,
          to: updates.due,
          changedAt: new Date().toISOString(),
          changedFrom: 'calendar',
          reason: calendarContext.changeReason || 'manual'
        }
      ];

      // Update overdue status
      const newDueDate = new Date(updates.due);
      const now = new Date();
      processedUpdates.isOverdue = newDueDate < now && updates.status !== 'completed';
    }

    // Handle status changes
    if (updates.status && updates.status !== originalTask.status) {
      // Validate workflow transition
      if (!this.validateWorkflowTransition(originalTask.status, updates.status, originalTask.workflow)) {
        throw new Error(`Invalid status transition from ${originalTask.status} to ${updates.status}`);
      }

      processedUpdates.statusChangeHistory = [
        ...(originalTask.statusChangeHistory || []),
        {
          from: originalTask.status,
          to: updates.status,
          changedAt: new Date().toISOString(),
          changedFrom: 'calendar',
          reason: calendarContext.changeReason || 'manual'
        }
      ];

      // Handle completion
      if (updates.status === 'completed' && originalTask.status !== 'completed') {
        processedUpdates.completedAt = new Date().toISOString();
        processedUpdates.completedFrom = 'calendar';
        processedUpdates.completionTime = this.calculateCompletionTime(originalTask);
      }

      // Handle reopening
      if (originalTask.status === 'completed' && updates.status !== 'completed') {
        processedUpdates.completedAt = null;
        processedUpdates.reopenedAt = new Date().toISOString();
        processedUpdates.reopenedFrom = 'calendar';
      }
    }

    return processedUpdates;
  },

  /**
   * Calculate task completion time
   */
  calculateCompletionTime(task) {
    if (!task.createdAt) return null;
    
    const created = new Date(task.createdAt);
    const completed = new Date();
    const diffMs = completed - created;
    
    return {
      totalMs: diffMs,
      days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    };
  },

  /**
   * Handle task drag and drop operations
   */
  processDragDropOperation(taskId, sourceDate, targetDate, calendarContext) {
    const updates = {
      due: targetDate.toISOString(),
      dragDropHistory: {
        from: sourceDate.toISOString(),
        to: targetDate.toISOString(),
        movedAt: new Date().toISOString(),
        view: calendarContext.currentView
      }
    };

    // Add context-specific updates
    if (calendarContext.currentView === 'week' || calendarContext.currentView === 'day') {
      // Preserve time when moving between days in time-based views
      const sourceTime = sourceDate.getHours() * 60 + sourceDate.getMinutes();
      const targetDateTime = new Date(targetDate);
      targetDateTime.setHours(Math.floor(sourceTime / 60), sourceTime % 60, 0, 0);
      updates.due = targetDateTime.toISOString();
    }

    return updates;
  },

  /**
   * Handle bulk operations from calendar
   */
  processBulkOperation(taskIds, operation, operationData, calendarContext) {
    const bulkUpdate = {
      taskIds,
      operation,
      operationData,
      bulkOperationContext: {
        view: calendarContext.currentView,
        executedAt: new Date().toISOString(),
        executedFrom: 'calendar'
      }
    };

    switch (operation) {
      case 'status_change':
        bulkUpdate.updates = {
          status: operationData.newStatus,
          bulkStatusChange: {
            changedAt: new Date().toISOString(),
            changedFrom: 'calendar',
            reason: operationData.reason || 'bulk_operation'
          }
        };
        break;

      case 'date_change':
        bulkUpdate.updates = {
          due: operationData.newDate,
          bulkDateChange: {
            changedAt: new Date().toISOString(),
            changedFrom: 'calendar',
            reason: operationData.reason || 'bulk_operation'
          }
        };
        break;

      case 'priority_change':
        bulkUpdate.updates = {
          priority: operationData.newPriority,
          bulkPriorityChange: {
            changedAt: new Date().toISOString(),
            changedFrom: 'calendar',
            reason: operationData.reason || 'bulk_operation'
          }
        };
        break;

      case 'tag_add':
        bulkUpdate.updates = {
          $addToSet: { tags: { $each: operationData.tags } },
          bulkTagAdd: {
            addedAt: new Date().toISOString(),
            addedFrom: 'calendar',
            tags: operationData.tags
          }
        };
        break;

      case 'tag_remove':
        bulkUpdate.updates = {
          $pullAll: { tags: operationData.tags },
          bulkTagRemove: {
            removedAt: new Date().toISOString(),
            removedFrom: 'calendar',
            tags: operationData.tags
          }
        };
        break;

      default:
        throw new Error(`Unknown bulk operation: ${operation}`);
    }

    return bulkUpdate;
  },

  /**
   * Validate task data consistency between calendar and task manager
   */
  validateTaskConsistency(calendarTask, taskManagerTask) {
    const inconsistencies = [];
    
    // Critical fields that must match
    const criticalFields = ['_id', 'title', 'status', 'priority'];
    criticalFields.forEach(field => {
      if (calendarTask[field] !== taskManagerTask[field]) {
        inconsistencies.push({
          field,
          calendarValue: calendarTask[field],
          taskManagerValue: taskManagerTask[field],
          severity: 'critical'
        });
      }
    });

    // Important fields that should match
    const importantFields = ['due', 'description', 'tags'];
    importantFields.forEach(field => {
      if (JSON.stringify(calendarTask[field]) !== JSON.stringify(taskManagerTask[field])) {
        inconsistencies.push({
          field,
          calendarValue: calendarTask[field],
          taskManagerValue: taskManagerTask[field],
          severity: 'important'
        });
      }
    });

    // Check timestamps
    if (calendarTask.updatedAt && taskManagerTask.updatedAt) {
      const calendarTime = new Date(calendarTask.updatedAt);
      const taskManagerTime = new Date(taskManagerTask.updatedAt);
      
      if (Math.abs(calendarTime - taskManagerTime) > 5000) { // 5 second tolerance
        inconsistencies.push({
          field: 'updatedAt',
          calendarValue: calendarTask.updatedAt,
          taskManagerValue: taskManagerTask.updatedAt,
          severity: 'warning',
          timeDiff: Math.abs(calendarTime - taskManagerTime)
        });
      }
    }

    return inconsistencies;
  },

  /**
   * Resolve task data conflicts
   */
  resolveTaskConflict(calendarTask, taskManagerTask, strategy = 'latest') {
    switch (strategy) {
      case 'latest':
        // Use the task with the most recent update
        const calendarTime = new Date(calendarTask.updatedAt || 0);
        const taskManagerTime = new Date(taskManagerTask.updatedAt || 0);
        return calendarTime > taskManagerTime ? calendarTask : taskManagerTask;

      case 'calendar_priority':
        // Prefer calendar version for calendar-specific fields
        return {
          ...taskManagerTask,
          due: calendarTask.due || taskManagerTask.due,
          calendarMetadata: calendarTask.calendarMetadata,
          dragDropHistory: calendarTask.dragDropHistory,
          calendarContext: calendarTask.calendarContext
        };

      case 'task_manager_priority':
        // Prefer task manager version for core fields
        return {
          ...calendarTask,
          title: taskManagerTask.title,
          description: taskManagerTask.description,
          status: taskManagerTask.status,
          priority: taskManagerTask.priority,
          tags: taskManagerTask.tags
        };

      case 'merge':
        // Merge both versions intelligently
        return {
          ...taskManagerTask,
          ...calendarTask,
          // Merge arrays
          tags: [...new Set([...(taskManagerTask.tags || []), ...(calendarTask.tags || [])])],
          // Keep both metadata
          calendarMetadata: calendarTask.calendarMetadata,
          taskManagerMetadata: taskManagerTask.taskManagerMetadata,
          // Use latest timestamp
          updatedAt: calendarTime > taskManagerTime ? calendarTask.updatedAt : taskManagerTask.updatedAt
        };

      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }
  },

  /**
   * Generate integration report
   */
  generateIntegrationReport(calendarTasks, taskManagerTasks) {
    const report = {
      timestamp: new Date().toISOString(),
      totalCalendarTasks: calendarTasks.length,
      totalTaskManagerTasks: taskManagerTasks.length,
      synchronized: 0,
      conflicts: 0,
      calendarOnly: 0,
      taskManagerOnly: 0,
      inconsistencies: []
    };

    const calendarTaskIds = new Set(calendarTasks.map(t => t._id));
    const taskManagerTaskIds = new Set(taskManagerTasks.map(t => t._id));

    // Find tasks only in calendar
    report.calendarOnly = calendarTasks.filter(t => !taskManagerTaskIds.has(t._id)).length;

    // Find tasks only in task manager
    report.taskManagerOnly = taskManagerTasks.filter(t => !calendarTaskIds.has(t._id)).length;

    // Check synchronized tasks for conflicts
    calendarTasks.forEach(calendarTask => {
      const taskManagerTask = taskManagerTasks.find(t => t._id === calendarTask._id);
      if (taskManagerTask) {
        const inconsistencies = this.validateTaskConsistency(calendarTask, taskManagerTask);
        if (inconsistencies.length > 0) {
          report.conflicts++;
          report.inconsistencies.push({
            taskId: calendarTask._id,
            taskTitle: calendarTask.title,
            inconsistencies
          });
        } else {
          report.synchronized++;
        }
      }
    });

    return report;
  }
};

export default calendarWorkflowIntegration;