import api from './api';

/**
 * Team service for handling all team-related API operations
 */
class TeamService {
  constructor() {
    this.baseURL = '/teams';
  }

  /**
   * Get all teams for the authenticated user
   * @returns {Promise<Array>} Array of teams
   */
  async getTeams() {
    try {
      const response = await api.get(this.baseURL);
      
      // Handle both response formats
      const responseData = response.data;
      if (responseData.success !== undefined) {
        // Backend returns { success, data, message }
        return {
          success: responseData.success,
          data: responseData.data || [],
          message: responseData.message || 'Teams fetched successfully'
        };
      } else {
        // Fallback for direct data response
        return {
          success: true,
          data: Array.isArray(responseData) ? responseData : [],
          message: 'Teams fetched successfully'
        };
      }
    } catch (error) {
      return this.handleError(error, 'Failed to fetch teams');
    }
  }

  /**
   * Get a specific team by ID
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Team data
   */
  async getTeam(teamId) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const response = await api.get(`${this.baseURL}/${teamId}`);
      
      // Handle both response formats
      const responseData = response.data;
      if (responseData.success !== undefined) {
        // Backend returns { success, data, message }
        return {
          success: responseData.success,
          data: responseData.data,
          message: responseData.message || 'Team fetched successfully'
        };
      } else {
        // Fallback for direct data response
        return {
          success: true,
          data: responseData,
          message: 'Team fetched successfully'
        };
      }
    } catch (error) {
      //console.error('❌ [TeamService] Error:', error.message);
      return this.handleError(error, 'Failed to fetch team');
    }
  }

  /**
   * Create a new team
   * @param {Object} teamData - Team creation data
   * @param {string} teamData.name - Team name
   * @param {string} teamData.description - Team description
   * @param {boolean} teamData.isPrivate - Whether team is private
   * @returns {Promise<Object>} Created team data
   */
  async createTeam(teamData) {
    try {
      const { name, description, isPrivate = false } = teamData;

      if (!name || name.trim().length === 0) {
        throw new Error('Team name is required');
      }

      if (name.length > 100) {
        throw new Error('Team name must be less than 100 characters');
      }

      if (description && description.length > 500) {
        throw new Error('Team description must be less than 500 characters');
      }

      const payload = {
        name: name.trim(),
        description: description?.trim() || '',
        isPrivate
      };

      const response = await api.post(this.baseURL, payload);
      return {
        success: true,
        data: response.data,
        message: 'Team created successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create team');
    }
  }

  /**
   * Update an existing team
   * @param {string} teamId - Team ID
   * @param {Object} updateData - Team update data
   * @returns {Promise<Object>} Updated team data
   */
  async updateTeam(teamId, updateData) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const { name, description, isPrivate } = updateData;

      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          throw new Error('Team name is required');
        }
        if (name.length > 100) {
          throw new Error('Team name must be less than 100 characters');
        }
      }

      if (description !== undefined && description.length > 500) {
        throw new Error('Team description must be less than 500 characters');
      }

      const payload = {};
      if (name !== undefined) payload.name = name.trim();
      if (description !== undefined) payload.description = description.trim();
      if (isPrivate !== undefined) payload.isPrivate = isPrivate;

      const response = await api.put(`${this.baseURL}/${teamId}`, payload);
      return {
        success: true,
        data: response.data,
        message: 'Team updated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update team');
    }
  }

  /**
   * Delete a team
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteTeam(teamId) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      await api.delete(`${this.baseURL}/${teamId}`);
      return {
        success: true,
        data: null,
        message: 'Team deleted successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to delete team');
    }
  }

  /**
   * Archive a team
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Archive result
   */
  async archiveTeam(teamId) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const response = await api.patch(`${this.baseURL}/${teamId}/archive`);
      return {
        success: true,
        data: response.data || response,
        message: 'Team archived successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to archive team');
    }
  }

  /**
   * Unarchive a team
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Unarchive result
   */
  async unarchiveTeam(teamId) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const response = await api.patch(`${this.baseURL}/${teamId}/unarchive`);
      return {
        success: true,
        data: response.data || response,
        message: 'Team unarchived successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to unarchive team');
    }
  }

  /**
   * Add a member to a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to add
   * @param {string} role - Member role (admin, member)
   * @returns {Promise<Object>} Updated team data
   */
  async addMember(teamId, userId, role = 'member') {
    try {
      if (!teamId || !userId) {
        throw new Error('Team ID and User ID are required');
      }

      if (!['admin', 'member'].includes(role)) {
        throw new Error('Role must be admin or member');
      }

      const payload = { userId, role };
      const response = await api.post(`${this.baseURL}/${teamId}/members`, payload);
      
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
   * Update a member's role in a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @returns {Promise<Object>} Updated team data
   */
  async updateMemberRole(teamId, userId, role) {
    try {
      if (!teamId || !userId || !role) {
        throw new Error('Team ID, User ID, and role are required');
      }

      if (!['owner', 'admin', 'member'].includes(role)) {
        throw new Error('Role must be owner, admin, or member');
      }

      const payload = { role };
      const response = await api.put(`${this.baseURL}/${teamId}/members/${userId}`, payload);
      
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
   * Remove a member from a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<Object>} Updated team data
   */
  async removeMember(teamId, userId) {
    try {
      if (!teamId || !userId) {
        throw new Error('Team ID and User ID are required');
      }

      const response = await api.delete(`${this.baseURL}/${teamId}/members/${userId}`);
      
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
   * Validate invite code and get team info without joining
   * @param {string} inviteCode - Team invite code
   * @returns {Promise<Object>} Team info
   */
  async validateInviteCode(inviteCode) {
    try {
      if (!inviteCode || inviteCode.trim().length === 0) {
        throw new Error('Invite code is required');
      }

      // Try to get team info by invite code
      const response = await api.get(`${this.baseURL}/invite/${inviteCode.trim()}/info`);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Invite code is valid'
      };
    } catch (error) {
      // If the endpoint doesn't exist, try joining and catching the error
      // This is a fallback for when the validate endpoint isn't available
      return this.handleError(error, 'Invalid or expired invite code');
    }
  }

  /**
   * Join a team using invite code
   * @param {string} inviteCode - Team invite code
   * @returns {Promise<Object>} Team data
   */
  async joinTeam(inviteCode) {
    try {
      if (!inviteCode || inviteCode.trim().length === 0) {
        throw new Error('Invite code is required');
      }

      const response = await api.post(`${this.baseURL}/join/${inviteCode.trim()}`);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Successfully joined team'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to join team');
    }
  }

  /**
   * Regenerate team invite code
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} New invite code
   */
  async regenerateInviteCode(teamId) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const response = await api.post(`${this.baseURL}/${teamId}/regenerate-invite`);
      
      return {
        success: true,
        data: response.data,
        message: 'Invite code regenerated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to regenerate invite code');
    }
  }

  /**
   * Get team statistics
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Team statistics
   */
  async getTeamStats(teamId) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const response = await api.get(`${this.baseURL}/${teamId}/stats`);
      
      return {
        success: true,
        data: response.data,
        message: 'Team statistics fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch team statistics');
    }
  }

  /**
   * Search teams (for public teams or team discovery)
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Search query
   * @param {boolean} searchParams.publicOnly - Search only public teams
   * @returns {Promise<Object>} Search results
   */
  async searchTeams(searchParams = {}) {
    try {
      const { query, publicOnly = false } = searchParams;
      
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (publicOnly) params.append('public', 'true');

      const response = await api.get(`${this.baseURL}/search?${params.toString()}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Teams search completed successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to search teams');
    }
  }

  /**
   * Send team invitation to a specific user
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to invite
   * @param {string} role - Role to assign (admin or member)
   * @param {string} message - Optional invitation message
   * @returns {Promise<Object>} Invitation result
   */
  async sendInvitation(teamId, userId, role = 'member', message = '') {
    try {
      if (!teamId || !userId) {
        throw new Error('Team ID and User ID are required');
      }

      if (!['admin', 'member'].includes(role)) {
        throw new Error('Role must be admin or member');
      }

      const payload = {
        userId,
        role,
        message: message?.trim() || undefined
      };

      const response = await api.post(`${this.baseURL}/${teamId}/invitations`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Invitation sent successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to send invitation');
    }
  }

  /**
   * Send team invitation via email
   * @param {string} teamId - Team ID
   * @param {Array<string>} emails - Array of email addresses
   * @param {string} role - Role to assign to invited members
   * @param {string} message - Optional invitation message
   * @returns {Promise<Object>} Invitation result
   */
  async sendInvitations(teamId, emails, role = 'member', message = '') {
    try {
      if (!teamId || !emails || !Array.isArray(emails) || emails.length === 0) {
        throw new Error('Team ID and email addresses are required');
      }

      // Validate email addresses
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      }

      if (!['admin', 'member'].includes(role)) {
        throw new Error('Role must be admin or member');
      }

      const payload = {
        emails: emails.map(email => email.trim().toLowerCase()),
        role,
        message: message.trim()
      };

      const response = await api.post(`${this.baseURL}/${teamId}/invite`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Invitations sent successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to send invitations');
    }
  }

  /**
   * Get team activity feed
   * @param {string} teamId - Team ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of activities to fetch
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Object>} Team activity data
   */
  async getTeamActivity(teamId, options = {}) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const { limit = 20, offset = 0 } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await api.get(`${this.baseURL}/${teamId}/activity?${params.toString()}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Team activity fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch team activity');
    }
  }

  /**
   * Leave a team
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Leave result
   */
  async leaveTeam(teamId) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      // Get current user ID from the session (GET /auth/me returns
      // { success, data: { user } })
      const meResponse = await api.get('/auth/me');
      const currentUser = meResponse.data?.data?.user || meResponse.data?.user;
      const userId = currentUser?._id || currentUser?.id;

      if (!userId) {
        throw new Error('Unable to determine current user');
      }

      const response = await api.delete(`${this.baseURL}/${teamId}/members/${userId}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Successfully left team'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to leave team');
    }
  }

  /**
   * Transfer team ownership
   * @param {string} teamId - Team ID
   * @param {string} newOwnerId - New owner user ID
   * @returns {Promise<Object>} Transfer result
   */
  async transferOwnership(teamId, newOwnerId) {
    try {
      if (!teamId || !newOwnerId) {
        throw new Error('Team ID and new owner ID are required');
      }

      const payload = { newOwnerId };
      const response = await api.post(`${this.baseURL}/${teamId}/transfer-ownership`, payload);
      
      return {
        success: true,
        data: response.data,
        message: 'Ownership transferred successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to transfer ownership');
    }
  }

  /**
   * Get team members with detailed information
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Team members data
   */
  async getTeamMembers(teamId) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const response = await api.get(`${this.baseURL}/${teamId}/members`);
      
      return {
        success: true,
        data: response.data,
        message: 'Team members fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch team members');
    }
  }

  /**
   * Bulk operations for team management
   * @param {string} teamId - Team ID
   * @param {Object} operations - Bulk operations data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkOperations(teamId, operations) {
    try {
      if (!teamId || !operations) {
        throw new Error('Team ID and operations are required');
      }

      const response = await api.post(`${this.baseURL}/${teamId}/bulk`, operations);
      
      return {
        success: true,
        data: response.data,
        message: 'Bulk operations completed successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to perform bulk operations');
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
    //console.error('TeamService Error:', error);

    let message = defaultMessage;
    let statusCode = 500;

    if (error.response) {
      // Server responded with error status
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
      
      // Handle validation errors
      if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
        message = error.response.data.errors.map(err => err.msg).join(', ');
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection and try again.';
      statusCode = 0;
    } else if (error.message) {
      // Client-side error
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
   * Validate team data
   * @private
   * @param {Object} teamData - Team data to validate
   * @returns {Object} Validation result
   */
  validateTeamData(teamData) {
    const errors = [];

    if (!teamData.name || teamData.name.trim().length === 0) {
      errors.push('Team name is required');
    }

    if (teamData.name && teamData.name.length > 100) {
      errors.push('Team name must be less than 100 characters');
    }

    if (teamData.description && teamData.description.length > 500) {
      errors.push('Team description must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export singleton instance
const teamService = new TeamService();
export default teamService;