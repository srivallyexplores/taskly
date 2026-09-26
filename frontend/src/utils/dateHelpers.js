// Date utility functions for React components
// Converted from legacy JavaScript

/**
 * Gets a date string for quick date selection
 * @param {string} option - Date option ('today', 'tomorrow', 'nextweek')
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getQuickDate(option) {
  const today = new Date();
  
  const dateOptions = {
    today: new Date(today),
    tomorrow: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    nextweek: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
  };

  const selectedDate = dateOptions[option];
  if (!selectedDate) return '';
  
  return selectedDate.toISOString().split('T')[0];
}

/**
 * Formats a date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Checks if a date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isDateInPast(date) {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dateObj < today;
}