// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000
}

// Task Status Constants
export const TASK_STATUS = {
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

// Task Priority Constants
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE) || 10,
  MAX_LIMIT: 100
}

// Team & Project Configuration
export const TEAM_CONFIG = {
  MAX_MEMBERS: parseInt(import.meta.env.VITE_MAX_TEAM_MEMBERS) || 50,
  MAX_PROJECTS: parseInt(import.meta.env.VITE_MAX_PROJECTS_PER_TEAM) || 10,
  INVITE_CODE_LENGTH: 16
}

export const PROJECT_CONFIG = {
  MAX_MEMBERS: parseInt(import.meta.env.VITE_MAX_PROJECT_MEMBERS) || 20,
  MAX_TASKS: 1000,
  MAX_MILESTONES: 20
}

// File Upload Configuration
export const FILE_CONFIG = {
  MAX_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880, // 5MB
  ALLOWED_TYPES: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
  MAX_FILES: 10
}

// Feature Flags
export const FEATURES = {
  TEAMS: import.meta.env.VITE_ENABLE_TEAMS === 'true',
  PROJECTS: import.meta.env.VITE_ENABLE_PROJECTS === 'true',
  CALENDAR: import.meta.env.VITE_ENABLE_CALENDAR === 'true',
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  DARK_MODE: import.meta.env.VITE_ENABLE_DARK_MODE === 'true'
}

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  REGISTER_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  TASK_CREATED: 'Task created successfully!',
  TASK_UPDATED: 'Task updated successfully!',
  TASK_DELETED: 'Task deleted successfully!',
  TASK_COMPLETED: 'Task marked as completed!'
}

// Form Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address'
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MESSAGE: 'Password must be at least 6 characters long'
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    MESSAGE: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
  },
  TASK_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
    MESSAGE: 'Task title must be between 1 and 200 characters'
  }
}

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm'
}

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  USERS: '/users',
  TASKS: '/tasks',
  CALENDAR: '/calendar',
  TEAMS: '/teams',
  PROJECTS: '/projects',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  ABOUT: '/about'
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
}