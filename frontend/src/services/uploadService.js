import apiService from './api'

const uploadService = {
  // Upload avatar image
  async uploadAvatar(file) {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await apiService.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response
    } catch (error) {
      //console.error('Avatar upload error:', error)
      throw error
    }
  },

  // Delete avatar image
  async deleteAvatar() {
    try {
      const response = await apiService.delete('/upload/avatar')
      return response
    } catch (error) {
      //console.error('Avatar deletion error:', error)
      throw error
    }
  },

  // Validate image file
  validateImageFile(file) {
    const errors = []

    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('Please select an image file')
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      errors.push('Image size must be less than 5MB')
    }

    // Check file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      errors.push('Please select a JPEG, PNG, GIF, or WebP image')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default uploadService