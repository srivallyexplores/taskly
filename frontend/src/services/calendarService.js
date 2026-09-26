import api from './api';

/**
 * Calendar service for handling calendar-related API operations
 */
class CalendarService {
  constructor() {
    this.baseURL = '/calendar';
  }

  /**
   * Get calendar events for a date range
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (ISO string)
   * @param {string} params.endDate - End date (ISO string)
   * @param {string} params.view - Calendar view (month, week, day)
   * @returns {Promise<Object>} Calendar events
   */
  async getEvents(params) {
    try {
      const { startDate, endDate, view = 'month' } = params;

      if (!startDate) {
        throw new Error('Start date is required');
      }

      const queryParams = new URLSearchParams({
        startDate,
        view
      });

      if (endDate) {
        queryParams.append('endDate', endDate);
      }

      const response = await api.get(`${this.baseURL}/events?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Calendar events fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch calendar events');
    }
  }

  /**
   * Get tasks for a specific date
   * @param {string} date - Date (ISO string)
   * @returns {Promise<Object>} Tasks for the date
   */
  async getTasksForDate(date) {
    try {
      if (!date) {
        throw new Error('Date is required');
      }

      const response = await api.get(`${this.baseURL}/tasks/${date}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Tasks fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch tasks for date');
    }
  }

  /**
   * Create a task from calendar
   * @param {Object} taskData - Task data
   * @param {string} taskData.title - Task title
   * @param {string} taskData.due - Due date (ISO string)
   * @param {string} taskData.priority - Priority level
   * @param {string} taskData.description - Task description
   * @returns {Promise<Object>} Created task
   */
  async createTask(taskData) {
    try {
      const { title, due, priority = 'medium', description, tags, project } = taskData;

      if (!title || !due) {
        throw new Error('Title and due date are required');
      }

      const payload = {
        title: title.trim(),
        due,
        priority,
        description: description?.trim() || '',
        tags: tags || [],
        project: project || null
      };

      const response = await api.post(`${this.baseURL}/tasks`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Task created successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create task');
    }
  }

  /**
   * Update task date (for drag-and-drop)
   * @param {string} taskId - Task ID
   * @param {string} newDate - New due date (ISO string)
   * @returns {Promise<Object>} Updated task
   */
  async updateTaskDate(taskId, newDate) {
    try {
      if (!taskId || !newDate) {
        throw new Error('Task ID and new date are required');
      }

      const response = await api.put(`${this.baseURL}/tasks/${taskId}/date`, {
        due: newDate
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Task date updated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update task date');
    }
  }

  /**
   * Get recurring task instances
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (ISO string)
   * @param {string} params.endDate - End date (ISO string)
   * @returns {Promise<Object>} Recurring task instances
   */
  async getRecurringInstances(params) {
    try {
      const { startDate, endDate } = params;

      if (!startDate || !endDate) {
        throw new Error('Start and end dates are required');
      }

      const queryParams = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await api.get(`${this.baseURL}/recurring?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Recurring instances fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch recurring instances');
    }
  }

  /**
   * Get calendar summary (task counts by date)
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (ISO string)
   * @param {string} params.endDate - End date (ISO string)
   * @returns {Promise<Object>} Calendar summary
   */
  async getSummary(params) {
    try {
      const { startDate, endDate } = params;

      if (!startDate || !endDate) {
        throw new Error('Start and end dates are required');
      }

      const queryParams = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await api.get(`${this.baseURL}/summary?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Calendar summary fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch calendar summary');
    }
  }

  /**
   * Handle API errors
   * @private
   */
  handleError(error, defaultMessage) {
    //console.error('CalendarService Error:', error);

    let message = defaultMessage;
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      message = error.response.data?.error?.message || error.response.data?.message || defaultMessage;
      
      if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
        message = error.response.data.errors.map(err => err.msg).join(', ');
      }
    } else if (error.request) {
      message = 'Network error. Please check your connection.';
      statusCode = 0;
    } else if (error.message) {
      message = error.message;
      statusCode = 400;
    }

    return {
      success: false,
      data: null,
      message,
      statusCode,
      error: error.message || defaultMessage
    };
  }
}

const calendarService = new CalendarService();
export default calendarService;
