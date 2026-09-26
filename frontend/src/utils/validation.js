// React-compatible validation utilities
// Converted from legacy DOM-based validation

/**
 * Validates form input and returns validation result
 * @param {string} value - The input value to validate
 * @param {function} condition - Validation condition function
 * @param {string} errorMessage - Error message to display
 * @returns {object} Validation result with isValid and error properties
 */
export function validateInput(value, condition, errorMessage = '') {
  const isValid = condition(value);
  return {
    isValid,
    error: isValid ? '' : errorMessage
  };
}

/**
 * Validates task title
 * @param {string} title - Task title to validate
 * @returns {object} Validation result
 */
export function validateTitle(title) {
  return validateInput(
    title,
    (value) => value && value.trim().length > 0,
    'Title is required.'
  );
}

/**
 * Validates due date
 * @param {string} dueDate - Due date to validate
 * @returns {object} Validation result
 */
export function validateDueDate(dueDate) {
  if (!dueDate) {
    return { isValid: false, error: 'Due date is required.' };
  }
  
  const selectedDate = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return validateInput(
    dueDate,
    () => selectedDate >= today,
    'Due date cannot be in the past.'
  );
}

/**
 * Validates priority selection
 * @param {string} priority - Selected priority
 * @returns {object} Validation result
 */
export function validatePriority(priority) {
  return validateInput(
    priority,
    (value) => value && ['low', 'medium', 'high'].includes(value.toLowerCase()),
    'Please select a priority.'
  );
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {object} Validation result
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateInput(
    email,
    (value) => value && value.trim().length > 0 && emailRegex.test(value),
    'A valid email is required.'
  );
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
export function validatePassword(password) {
  return validateInput(
    password,
    (value) => value && value.length >= 6,
    'Password must be at least 6 characters.'
  );
}

/**
 * Validates password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {object} Validation result
 */
export function validatePasswordConfirmation(password, confirmPassword) {
  return validateInput(
    confirmPassword,
    (value) => value && value === password,
    'Passwords must match.'
  );
}

/**
 * Validates full name
 * @param {string} fullName - Full name to validate
 * @returns {object} Validation result
 */
export function validateFullName(fullName) {
  return validateInput(
    fullName,
    (value) => value && value.trim().length > 0,
    'Full name is required.'
  );
}

/**
 * Validates username
 * @param {string} username - Username to validate
 * @returns {object} Validation result
 */
export function validateUsername(username) {
  return validateInput(
    username,
    (value) => value && value.trim().length > 0,
    'Username is required.'
  );
}