import apiService from './api'

const taskService = {
  // Get user's tasks with pagination and filtering
  async getUserTasks(userId, options = {}) {
    try {
      console.log('📋 [taskService] getUserTasks called with:', { userId, options });
      
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      })
      
      if (status) params.append('status', status)
      if (priority) params.append('priority', priority)
      if (search) params.append('search', search)
      
      const endpoint = `/tasks?${params}`;
      console.log('📋 [taskService] Calling endpoint:', endpoint);
      
      // Use the simpler /tasks endpoint that gets tasks for current authenticated user
      const response = await apiService.get(endpoint)
      
      console.log('📋 [taskService] Response received:', response);
      console.log('📋 [taskService] Response.data:', response.data);
      console.log('📋 [taskService] Response.tasks:', response.tasks);
      
      return response
    } catch (error) {
      console.error('❌ [taskService] getUserTasks error:', error);
      throw this.handleTaskError(error)
    }
  },

  // Alias for getUserTasks (for compatibility)
  async getTasksByUser(userId, options = {}) {
    return this.getUserTasks(userId, options)
  },

  // Get all tasks (admin view)
  async getAllTasks(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      })
      
      if (status) params.append('status', status)
      if (priority) params.append('priority', priority)
      if (search) params.append('search', search)
      
      const response = await apiService.get(`/tasks?${params}`)
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Get tasks for a specific project
  async getProjectTasks(projectId, options = {}) {
    try {
      // //console.log('  [taskService] ========== GET PROJECT TASKS ==========');
      // //console.log('  [taskService] Project ID:', projectId);
      // //console.log('  [taskService] Options:', options);
      
      const {
        page = 1,
        limit = 100,
        status,
        priority,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      })
      
      if (status) params.append('status', status)
      if (priority) params.append('priority', priority)
      if (search) params.append('search', search)
      
      const endpoint = `/projects/${projectId}/tasks?${params}`;
      // //console.log('  [taskService] Endpoint:', endpoint);
      
      const response = await apiService.get(endpoint)
      
      // //console.log('  [taskService] Response:', response);
      // //console.log('  [taskService] Response data:', response.data);
      
      return response
    } catch (error) {
      //console.error('❌ [taskService] Get project tasks error:', error);
      //console.error('❌ [taskService] Error response:', error.response?.data);
      throw this.handleTaskError(error)
    }
  },

  // Get task by ID
  async getTaskById(taskId) {
    try {
      const response = await apiService.get(`/tasks/${taskId}`)
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Alias for getTaskById
  async getTask(taskId) {
    return this.getTaskById(taskId)
  },

  // Create new task
  async createTask(taskData) {
    try {
      
      
      const response = await apiService.post('/tasks', taskData)
      
      
      
      
      return response
    } catch (error) {
      
      throw this.handleTaskError(error)
    }
  },

  // Create task for specific user
  async createTaskForUser(userId, taskData) {
    try {
      const response = await apiService.post(`/users/${userId}/tasks`, taskData)
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Update task
  async updateTask(taskId, taskData) {
    try {
      const response = await apiService.put(`/tasks/${taskId}`, taskData)
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Delete task
  async deleteTask(taskId) {
    try {
      const response = await apiService.delete(`/tasks/${taskId}`)
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Mark task as complete
  async completeTask(taskId) {
    try {
      const response = await apiService.patch(`/tasks/${taskId}/complete`)
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Update task status
  async updateTaskStatus(taskId, status) {
    try {
      const response = await apiService.patch(`/tasks/${taskId}/status`, { status })
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Get task statistics for a user
  async getTaskStats(userId) {
    try {
      const response = await apiService.get(`/users/${userId}/stats`)
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Search tasks
  async searchTasks(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        userId,
        status,
        priority
      } = options
      
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (userId) params.append('userId', userId)
      if (status) params.append('status', status)
      if (priority) params.append('priority', priority)
      
      const response = await apiService.get(`/tasks/search?${params}`)
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Bulk update tasks
  async bulkUpdateTasks(taskIds, updateData) {
    try {
      const response = await apiService.patch('/tasks/bulk', {
        taskIds,
        updateData
      })
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Bulk delete tasks
  async bulkDeleteTasks(taskIds) {
    try {
      const response = await apiService.delete('/tasks/bulk', {
        data: { taskIds }
      })
      return response
    } catch (error) {
      throw this.handleTaskError(error)
    }
  },

  // Handle task service errors
  handleTaskError(error) {
    console.error('🔴 [taskService] handleTaskError called with:', error);
    console.error('🔴 [taskService] error.response:', error.response);
    console.error('🔴 [taskService] error.response.data:', error.response?.data);
    
    let message = 'A task service error occurred'
    
    if (error.response?.data?.error?.message) {
      message = error.response.data.error.message
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    }

    // Create a standardized error object
    const taskError = new Error(message)
    taskError.status = error.response?.status
    taskError.code = error.response?.data?.error?.code
    taskError.response = error.response // Preserve the full response
    
    console.error('🔴 [taskService] Created taskError:', taskError);
    
    return taskError
  }
}

export default taskService