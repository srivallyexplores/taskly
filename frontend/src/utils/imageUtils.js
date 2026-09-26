/**
 * Utility functions for handling image URLs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Get the full URL for an avatar image
 * @param {string} avatar - Avatar path or URL
 * @returns {string} Full avatar URL
 */
export const getAvatarUrl = (avatar) => {
  if (!avatar) return `${API_BASE_URL}/img/placeholder-user.png`
  if (avatar.startsWith('http')) return avatar
  return `${API_BASE_URL}${avatar}`
}

/**
 * Get the full URL for any image served by the backend
 * @param {string} imagePath - Image path
 * @returns {string} Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath
  return `${API_BASE_URL}${imagePath}`
}

/**
 * Get placeholder image URL
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderUrl = () => {
  return `${API_BASE_URL}/img/placeholder-user.png`
}