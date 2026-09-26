import api from './api';

/**
 * Project service for handling all project-related API operations
 */
class ProjectService {
  constructor() {
    this.baseURL = '/projects';
  }

  /**
   * Get all projects for the authenticated user
   * @param {Object} filters - Filter options
   * @param {string} filters.teamId - Filter by team ID
   * @param {string} filters.status - Filter by status
   * @param {string} filters.priority - Filter by priority
   * @returns {Promise<Array>} Array of projects
   */
  async getProjects(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.teamId) params.append('teamId', filters.teamId);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);

      const url = params.toString() ? `${this.baseURL}?${params.toString()}` : this.baseURL;
      const response = await api.get(url);
      
      // Handle both response formats
      const responseData = response.data;
      if (responseData.success !== undefined) {
        // Backend returns { success, data, message }
        return {
          success: responseData.success,
          data: responseData.data || [],
          message: responseData.message || 'Projects fetched successfully'
        };
      } else {
        // Fallback for direct data response
        return {
          success: true,
          data: Array.isArray(responseData) ? responseData : [],
          message: 'Projects fetched successfully'
        };
      }
    } catch (error) {
      return this.handleError(error, 'Failed to fetch projects');
    }
  }

  /**
   * Get a specific project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project data
   */
  async getProject(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await api.get(`${this.baseURL}/${projectId}`);
      
      // Handle both response formats
      const responseData = response.data;
      if (responseData.success !== undefined) {
        // Backend returns { success, data, message }
        return {
          success: responseData.success,
          data: responseData.data,
          message: responseData.message || 'Project fetched successfully'
        };
      } else {
        // Fallback for direct data response
        return {
          success: true,
          data: responseData,
          message: 'Project fetched successfully'
        };
      }
    } catch (error) {
      //console.error('❌ [ProjectService] Error:', error.message);
      return this.handleError(error, 'Failed to fetch project');
    }
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project creation data
   * @param {string} projectData.name - Project name
   * @param {string} projectData.description - Project description
   * @param {string} projectData.teamId - Team ID
   * @param {string} projectData.startDate - Start date (ISO string)
   * @param {string} projectData.endDate - End date (ISO string)
   * @param {string} projectData.priority - Priority level
   * @param {string} projectData.status - Project status
   * @returns {Promise<Object>} Created project data
   */
  async createProject(projectData) {
    try {
      const validation = this.validateProjectData(projectData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const {
        name,
        description,
        teamId,
        startDate,
        endDate,
        priority = 'medium',
        status = 'planning'
      } = projectData;

      // Validate dates
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          throw new Error('Start date cannot be after end date');
        }
      }

      const payload = {
        name: name.trim(),
        description: description?.trim() || '',
        teamId,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        priority,
        status
      };

      const response = await api.post(this.baseURL, payload);
      return {
        success: true,
        data: response.data,
        message: 'Project created successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create project');
    }
  }

  /**
   * Update an existing project
   * @param {string} projectId - Project ID
   * @param {Object} updateData - Project update data
   * @returns {Promise<Object>} Updated project data
   */
  async updateProject(projectId, updateData) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const { name, description, startDate, endDate, priority, status } = updateData;

      // Validate required fields if provided
      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          throw new Error('Project name is required');
        }
        if (name.length > 100) {
          throw new Error('Project name must be less than 100 characters');
        }
      }

      if (description !== undefined && description.length > 1000) {
        throw new Error('Project description must be less than 1000 characters');
      }

      // Validate dates
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          throw new Error('Start date cannot be after end date');
        }
      }

      const payload = {};
      if (name !== undefined) payload.name = name.trim();
      if (description !== undefined) payload.description = description.trim();
      if (startDate !== undefined) payload.startDate = startDate ? new Date(startDate).toISOString() : null;
      if (endDate !== undefined) payload.endDate = endDate ? new Date(endDate).toISOString() : null;
      if (priority !== undefined) payload.priority = priority;
      if (status !== undefined) payload.status = status;

      const response = await api.put(`${this.baseURL}/${projectId}`, payload);
      return {
        success: true,
        data: response.data,
        message: 'Project updated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update project');
    }
  }

  /**
   * Delete a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteProject(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      await api.delete(`${this.baseURL}/${projectId}`);
      return {
        success: true,
        data: null,
        message: 'Project deleted successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to delete project');
    }
  }

  /**
   * Add a member to a project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID to add
   * @param {string} role - Member role (manager, contributor, viewer)
   * @returns {Promise<Object>} Updated project data
   */
  async addMember(projectId, userId, role = 'contributor') {
    try {
      if (!projectId || !userId) {
        throw new Error('Project ID and User ID are required');
      }

      if (!['manager', 'contributor', 'viewer'].includes(role)) {
        throw new Error('Role must be manager, contributor, or viewer');
      }

      const payload = { userId, role };
      const response = await api.post(`${this.baseURL}/${projectId}/members`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Member added successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to add member');
    }
  }

  /**
   * Update a member's role in a project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @returns {Promise<Object>} Updated project data
   */
  async updateMemberRole(projectId, userId, role) {
    try {
      if (!projectId || !userId || !role) {
        throw new Error('Project ID, User ID, and role are required');
      }

      if (!['manager', 'contributor', 'viewer'].includes(role)) {
        throw new Error('Role must be manager, contributor, or viewer');
      }

      const payload = { role };
      const response = await api.put(`${this.baseURL}/${projectId}/members/${userId}`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Member role updated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update member role');
    }
  }

  /**
   * Remove a member from a project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<Object>} Updated project data
   */
  async removeMember(projectId, userId) {
    try {
      if (!projectId || !userId) {
        throw new Error('Project ID and User ID are required');
      }

      const response = await api.delete(`${this.baseURL}/${projectId}/members/${userId}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Member removed successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to remove member');
    }
  }

  /**
   * Get project tasks
   * @param {string} projectId - Project ID
   * @param {Object} filters - Task filters
   * @param {string} filters.status - Filter by status
   * @param {string} filters.priority - Filter by priority
   * @param {string} filters.assignee - Filter by assignee
   * @returns {Promise<Object>} Project tasks
   */
  async getProjectTasks(projectId, filters = {}) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assignee) params.append('assignee', filters.assignee);

      const url = params.toString() 
        ? `${this.baseURL}/${projectId}/tasks?${params.toString()}`
        : `${this.baseURL}/${projectId}/tasks`;

      const response = await api.get(url);
      
      // The response might be the data directly or wrapped in response.data
      const tasks = response.data || response;
      
      return {
        success: true,
        data: tasks,
        message: 'Project tasks fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch project tasks');
    }
  }

  /**
   * Get project statistics
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project statistics
   */
  async getProjectStats(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await api.get(`${this.baseURL}/${projectId}/stats`);
      
      return {
        success: true,
        data: response.data,
        message: 'Project statistics fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch project statistics');
    }
  }

  /**
   * Archive a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Archive result
   */
  async archiveProject(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await api.post(`${this.baseURL}/${projectId}/archive`);
      
      return {
        success: true,
        data: response.data,
        message: 'Project archived successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to archive project');
    }
  }

  /**
   * Get project analytics data
   * @param {string} projectId - Project ID
   * @param {Object} options - Analytics options
   * @param {string} options.period - Time period (week, month, quarter, year)
   * @param {string} options.startDate - Start date for custom period
   * @param {string} options.endDate - End date for custom period
   * @returns {Promise<Object>} Analytics data
   */
  async getProjectAnalytics(projectId, options = {}) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const { period = 'month', startDate, endDate } = options;
      const params = new URLSearchParams({ period });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`${this.baseURL}/${projectId}/analytics?${params.toString()}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Project analytics fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch project analytics');
    }
  }

  /**
   * Get project timeline/milestones
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project timeline data
   */
  async getProjectTimeline(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await api.get(`${this.baseURL}/${projectId}/timeline`);
      
      return {
        success: true,
        data: response.data,
        message: 'Project timeline fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch project timeline');
    }
  }

  /**
   * Add milestone to project
   * @param {string} projectId - Project ID
   * @param {Object} milestoneData - Milestone data
   * @param {string} milestoneData.name - Milestone name
   * @param {string} milestoneData.description - Milestone description
   * @param {string} milestoneData.dueDate - Due date
   * @returns {Promise<Object>} Updated project data
   */
  async addMilestone(projectId, milestoneData) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const { name, description, dueDate } = milestoneData;

      if (!name || name.trim().length === 0) {
        throw new Error('Milestone name is required');
      }

      const payload = {
        name: name.trim(),
        description: description?.trim() || '',
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
      };

      const response = await api.post(`${this.baseURL}/${projectId}/milestones`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Milestone added successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to add milestone');
    }
  }

  /**
   * Update milestone status
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Milestone ID
   * @param {string} status - New status (pending, in-progress, completed)
   * @returns {Promise<Object>} Updated project data
   */
  async updateMilestoneStatus(projectId, milestoneId, status) {
    try {
      if (!projectId || !milestoneId || !status) {
        throw new Error('Project ID, Milestone ID, and status are required');
      }

      if (!['pending', 'in-progress', 'completed'].includes(status)) {
        throw new Error('Status must be pending, in-progress, or completed');
      }

      const payload = { status };
      const response = await api.put(`${this.baseURL}/${projectId}/milestones/${milestoneId}`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Milestone status updated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update milestone status');
    }
  }

  /**
   * Get project activity feed
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of activities to fetch
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Object>} Project activity data
   */
  async getProjectActivity(projectId, options = {}) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const { limit = 20, offset = 0 } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await api.get(`${this.baseURL}/${projectId}/activity?${params.toString()}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Project activity fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch project activity');
    }
  }

  /**
   * Export project data
   * @param {string} projectId - Project ID
   * @param {string} format - Export format (json, csv, pdf)
   * @returns {Promise<Object>} Export result
   */
  async exportProject(projectId, format = 'json') {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      if (!['json', 'csv', 'pdf'].includes(format)) {
        throw new Error('Format must be json, csv, or pdf');
      }

      const response = await api.get(`${this.baseURL}/${projectId}/export?format=${format}`, {
        responseType: format === 'pdf' ? 'blob' : 'json'
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Project exported successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to export project');
    }
  }

  /**
   * Duplicate a project
   * @param {string} projectId - Project ID to duplicate
   * @param {Object} options - Duplication options
   * @param {string} options.name - New project name
   * @param {boolean} options.includeTasks - Whether to include tasks
   * @param {boolean} options.includeMembers - Whether to include members
   * @returns {Promise<Object>} Duplicated project data
   */
  async duplicateProject(projectId, options = {}) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const { name, includeTasks = false, includeMembers = false } = options;

      if (!name || name.trim().length === 0) {
        throw new Error('New project name is required');
      }

      const payload = {
        name: name.trim(),
        includeTasks,
        includeMembers
      };

      const response = await api.post(`${this.baseURL}/${projectId}/duplicate`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Project duplicated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to duplicate project');
    }
  }

  /**
   * Get project templates
   * @returns {Promise<Object>} Available project templates
   */
  async getProjectTemplates() {
    try {
      const response = await api.get(`${this.baseURL}/templates`);
      
      return {
        success: true,
        data: response.data,
        message: 'Project templates fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch project templates');
    }
  }

  /**
   * Create project from template
   * @param {string} templateId - Template ID
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project data
   */
  async createFromTemplate(templateId, projectData) {
    try {
      if (!templateId) {
        throw new Error('Template ID is required');
      }

      const validation = this.validateProjectData(projectData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const payload = {
        templateId,
        ...projectData
      };

      const response = await api.post(`${this.baseURL}/from-template`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Project created from template successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create project from template');
    }
  }

  /**
   * Handle API errors and format response
   * @private
   * @param {Error} error - Error object
   * @param {string} defaultMessage - Default error message
   * @returns {Object} Formatted error response
   */
  handleError(error, defaultMessage) {
    //console.error('ProjectService Error:', error);

    let message = defaultMessage;
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      // Handle new error format { success, error: { message, code } }
      if (error.response.data?.error?.message) {
        message = error.response.data.error.message;
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      } else if (error.response.data?.error) {
        message = error.response.data.error;
      } else {
        message = defaultMessage;
      }
      
      if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
        message = error.response.data.errors.map(err => err.msg).join(', ');
      }
    } else if (error.request) {
      message = 'Network error. Please check your connection and try again.';
      statusCode = 0;
    } else if (error.message) {
      message = error.message;
      statusCode = 400;
    }

    return {
      success: false,
      data: [],
      message,
      statusCode,
      error: error.message || defaultMessage
    };
  }

  /**
   * Validate project data
   * @private
   * @param {Object} projectData - Project data to validate
   * @returns {Object} Validation result
   */
  validateProjectData(projectData) {
    const errors = [];

    if (!projectData.name || projectData.name.trim().length === 0) {
      errors.push('Project name is required');
    }

    if (projectData.name && projectData.name.length > 100) {
      errors.push('Project name must be less than 100 characters');
    }

    if (projectData.description && projectData.description.length > 1000) {
      errors.push('Project description must be less than 1000 characters');
    }

    if (!projectData.teamId) {
      errors.push('Team ID is required');
    }

    if (projectData.priority && !['low', 'medium', 'high'].includes(projectData.priority)) {
      errors.push('Priority must be low, medium, or high');
    }

    if (projectData.status && !['planning', 'active', 'on-hold', 'completed', 'cancelled'].includes(projectData.status)) {
      errors.push('Status must be planning, active, on-hold, completed, or cancelled');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export singleton instance
const projectService = new ProjectService();
export default projectService;