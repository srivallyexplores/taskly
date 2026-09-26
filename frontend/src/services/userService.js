import apiService from './api'

const userService = {
  // Get public users for home page showcase
  async getPublicUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search
      } = options
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (search) params.append('search', search)
      
      const response = await apiService.get(`/users/public?${params}`)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Get all users (authenticated)
  async getAllUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search
      } = options
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (search) params.append('search', search)
      
      const response = await apiService.get(`/users?${params}`)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await apiService.get(`/users/${userId}`)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put('/users/profile', profileData)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await apiService.put('/users/profile/password', passwordData)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Upload avatar file to Cloudinary
  async uploadAvatarFile(formData) {
    try {
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log('  -', pair[0], ':', {
            name: pair[1].name,
            type: pair[1].type,
            size: pair[1].size,
            sizeInMB: (pair[1].size / (1024 * 1024)).toFixed(2)
          });
        } else {
          console.log('  -', pair[0], ':', pair[1]);
        }
      }
      

      const response = await apiService.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      
      
      // Transform response to match expected format
      const result = {
        success: response.success,
        data: {
          avatarUrl: response.data?.avatar,
          publicId: response.data?.publicId
        },
        error: response.error
      };
      
      //console.log('📤 [UserService] Transformed response:', result);
      return result;
    } catch (error) {
      throw this.handleUserError(error);
    }
  },

  // Upload avatar (update avatar URL)
  async uploadAvatar(avatarData) {
    try {
      const response = await apiService.put('/users/profile/avatar', avatarData)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Get user statistics
  async getUserStats(userId) {
    try {
      const response = await apiService.get(`/users/${userId}/stats`)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Get user by ID (alias for getUserById for consistency)
  async getUser(userId) {
    return this.getUserById(userId)
  },

  // Update user (alias for updateProfile for consistency)
  async updateUser(userId, userData) {
    try {
      const response = await apiService.put(`/users/${userId}`, userData)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await apiService.delete(`/users/${userId}`)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Search users
  async searchUsers(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 10
      } = options
      
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: limit.toString()
      })
      
      const response = await apiService.get(`/users?${params}`)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Discover users for team invitations
  async discoverUsers(query, page = 1, limit = 20, teamId = null) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (query) params.append('q', query)
      if (teamId) params.append('teamId', teamId)
      
      const response = await apiService.get(`/users/discover?${params}`)
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Check invitation status for a user and team
  async checkInvitationStatus(userId, teamId) {
    try {
      const response = await apiService.get(`/users/${userId}/invitation-status`, {
        params: { teamId }
      })
      return response
    } catch (error) {
      throw this.handleUserError(error)
    }
  },

  // Handle user service errors
  handleUserError(error) {
    let message = 'A user service error occurred'
    
    if (error.response?.data?.error?.message) {
      message = error.response.data.error.message
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    }

    // Create a standardized error object
    const userError = new Error(message)
    userError.status = error.response?.status
    userError.code = error.response?.data?.error?.code
    
    return userError
  }
}

export default userService