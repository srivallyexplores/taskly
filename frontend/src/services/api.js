import axios from 'axios'

// Global error handler for API errors
let globalErrorHandler = null

export const setGlobalErrorHandler = (handler) => {
  globalErrorHandler = handler
}

// Create axios instance with base configuration
// In development, use relative URLs to leverage Vite proxy
// In production, use the full API URL from environment
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    // Development: use relative URL to leverage Vite proxy
    return '/api'
  }
  // Production: use full URL from environment
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is crucial for session cookies
})

// Request interceptor (no longer need to add auth token for session-based auth)
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized (not authenticated)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Clear user data from localStorage
      localStorage.removeItem('user')
      
      // Only redirect to login if we're on a protected route
      // Don't redirect from public pages like home
      const currentPath = window.location.pathname
      const publicPaths = ['/', '/about', '/login', '/signup', '/users']
      const isPublicRoute = publicPaths.includes(currentPath) || currentPath.startsWith('/users/')
      
      if (!isPublicRoute) {
        // Redirect to login page only from protected routes
        window.location.href = '/login'
      }
      
      return Promise.reject(error)
    }
    
    // Handle 403 Forbidden (authenticated but no permission)
    // Don't redirect - let the component handle the error
    if (error.response?.status === 403) {
      // Just reject the error, don't redirect
      return Promise.reject(error)
    }

    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.'
    }

    // Call global error handler if available and not suppressed
    if (globalErrorHandler && !originalRequest.suppressGlobalErrorHandler) {
      globalErrorHandler(error, {
        context: 'API Request',
        url: originalRequest.url,
        method: originalRequest.method
      })
    }

    return Promise.reject(error)
  }
)

// Generic API methods with retry logic and mock fallback
const apiService = {
  // GET request
  async get(url, config = {}) {
    try {
      const response = await api.get(url, config)
      return response.data
    } catch (error) {
      //console.error('API GET Error:', error.response?.data || error.message)
      throw error
    }
  },



  // POST request
  async post(url, data, config = {}) {
    try {
      const response = await api.post(url, data, config)
      return response.data
    } catch (error) {
      //console.error('API POST Error:', error.response?.data || error.message)
      throw error
    }
  },

  // PUT request
  async put(url, data, config = {}) {
    try {
      const response = await api.put(url, data, config)
      return response.data
    } catch (error) {
      //console.error('API PUT Error:', error.response?.data || error.message)
      throw error
    }
  },

  // PATCH request
  async patch(url, data, config = {}) {
    try {
      const response = await api.patch(url, data, config)
      return response.data
    } catch (error) {
      //console.error('API PATCH Error:', error.response?.data || error.message)
      throw error
    }
  },

  // DELETE request
  async delete(url, config = {}) {
    try {
      const response = await api.delete(url, config)
      return response.data
    } catch (error) {
      //console.error('API DELETE Error:', error.response?.data || error.message)
      throw error
    }
  }
}

export default apiService
export { api }