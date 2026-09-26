import { format, parse, isValid } from 'date-fns';

/**
 * Calendar routing utilities for URL state management
 */

// Valid calendar views
export const CALENDAR_VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda'
};

// Default view
export const DEFAULT_VIEW = CALENDAR_VIEWS.MONTH;

// Date format for URLs
export const URL_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Parse calendar parameters from URL
 * @param {Object} params - URL parameters from react-router
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Parsed calendar state
 */
export const parseCalendarParams = (params, searchParams) => {
  const { view: urlView, date: urlDate } = params;
  
  // Parse view
  const view = Object.values(CALENDAR_VIEWS).includes(urlView) 
    ? urlView 
    : DEFAULT_VIEW;
  
  // Parse date
  let date = new Date();
  if (urlDate) {
    const parsedDate = parse(urlDate, URL_DATE_FORMAT, new Date());
    if (isValid(parsedDate)) {
      date = parsedDate;
    }
  }
  
  // Parse additional search parameters
  const filters = {};
  const searchParamsObj = Object.fromEntries(searchParams.entries());
  
  // Parse filter parameters
  if (searchParamsObj.priority) {
    filters.priority = searchParamsObj.priority.split(',');
  }
  
  if (searchParamsObj.status) {
    filters.status = searchParamsObj.status.split(',');
  }
  
  if (searchParamsObj.tags) {
    filters.tags = searchParamsObj.tags.split(',');
  }
  
  if (searchParamsObj.projects) {
    filters.projects = searchParamsObj.projects.split(',');
  }
  
  if (searchParamsObj.assignees) {
    filters.assignees = searchParamsObj.assignees.split(',');
  }
  
  // Parse date range
  if (searchParamsObj.startDate && searchParamsObj.endDate) {
    const startDate = parse(searchParamsObj.startDate, URL_DATE_FORMAT, new Date());
    const endDate = parse(searchParamsObj.endDate, URL_DATE_FORMAT, new Date());
    
    if (isValid(startDate) && isValid(endDate)) {
      filters.dateRange = {
        start: format(startDate, URL_DATE_FORMAT),
        end: format(endDate, URL_DATE_FORMAT)
      };
    }
  }
  
  // Parse selected task
  const selectedTaskId = searchParamsObj.task || null;
  
  // Parse search query
  const searchQuery = searchParamsObj.q || '';
  
  return {
    view,
    date,
    filters,
    selectedTaskId,
    searchQuery
  };
};

/**
 * Generate calendar URL
 * @param {string} view - Calendar view
 * @param {Date} date - Current date
 * @param {Object} options - Additional options
 * @returns {string} Calendar URL
 */
export const generateCalendarUrl = (view = DEFAULT_VIEW, date = new Date(), options = {}) => {
  const { 
    filters = {}, 
    selectedTaskId = null, 
    searchQuery = '', 
    preserveParams = false 
  } = options;
  
  // Base URL
  let url = `/calendar/${view}`;
  
  // Add date if not today or if explicitly requested
  const today = new Date();
  const isToday = format(date, URL_DATE_FORMAT) === format(today, URL_DATE_FORMAT);
  
  if (!isToday || options.includeDate) {
    url += `/${format(date, URL_DATE_FORMAT)}`;
  }
  
  // Build search parameters
  const searchParams = new URLSearchParams();
  
  // Add filters
  if (filters.priority && filters.priority.length > 0) {
    searchParams.set('priority', filters.priority.join(','));
  }
  
  if (filters.status && filters.status.length > 0) {
    searchParams.set('status', filters.status.join(','));
  }
  
  if (filters.tags && filters.tags.length > 0) {
    searchParams.set('tags', filters.tags.join(','));
  }
  
  if (filters.projects && filters.projects.length > 0) {
    searchParams.set('projects', filters.projects.join(','));
  }
  
  if (filters.assignees && filters.assignees.length > 0) {
    searchParams.set('assignees', filters.assignees.join(','));
  }
  
  // Add date range
  if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
    searchParams.set('startDate', filters.dateRange.start);
    searchParams.set('endDate', filters.dateRange.end);
  }
  
  // Add selected task
  if (selectedTaskId) {
    searchParams.set('task', selectedTaskId);
  }
  
  // Add search query
  if (searchQuery) {
    searchParams.set('q', searchQuery);
  }
  
  // Append search parameters
  const searchString = searchParams.toString();
  if (searchString) {
    url += `?${searchString}`;
  }
  
  return url;
};

/**
 * Update URL with new calendar state
 * @param {Function} navigate - React Router navigate function
 * @param {string} view - Calendar view
 * @param {Date} date - Current date
 * @param {Object} options - Additional options
 */
export const updateCalendarUrl = (navigate, view, date, options = {}) => {
  const url = generateCalendarUrl(view, date, options);
  navigate(url, { replace: options.replace || false });
};

/**
 * Get calendar breadcrumbs for navigation
 * @param {string} view - Current view
 * @param {Date} date - Current date
 * @returns {Array} Breadcrumb items
 */
export const getCalendarBreadcrumbs = (view, date) => {
  const breadcrumbs = [
    { label: 'Calendar', href: '/calendar' }
  ];
  
  // Add view-specific breadcrumb
  switch (view) {
    case CALENDAR_VIEWS.MONTH:
      breadcrumbs.push({
        label: format(date, 'MMMM yyyy'),
        href: generateCalendarUrl(view, date)
      });
      break;
    case CALENDAR_VIEWS.WEEK:
      breadcrumbs.push({
        label: `Week of ${format(date, 'MMM d, yyyy')}`,
        href: generateCalendarUrl(view, date)
      });
      break;
    case CALENDAR_VIEWS.DAY:
      breadcrumbs.push({
        label: format(date, 'EEEE, MMMM d, yyyy'),
        href: generateCalendarUrl(view, date)
      });
      break;
    case CALENDAR_VIEWS.AGENDA:
      breadcrumbs.push({
        label: 'Agenda View',
        href: generateCalendarUrl(view, date)
      });
      break;
    default:
      break;
  }
  
  return breadcrumbs;
};

/**
 * Get shareable calendar URL
 * @param {string} view - Calendar view
 * @param {Date} date - Current date
 * @param {Object} filters - Applied filters
 * @returns {string} Shareable URL
 */
export const getShareableCalendarUrl = (view, date, filters = {}) => {
  const baseUrl = window.location.origin;
  const calendarUrl = generateCalendarUrl(view, date, { 
    filters, 
    includeDate: true 
  });
  
  return `${baseUrl}${calendarUrl}`;
};

/**
 * Parse calendar URL for deep linking
 * @param {string} url - Full URL
 * @returns {Object} Parsed calendar state
 */
export const parseCalendarUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Extract view and date from path
    const view = pathParts[1] || DEFAULT_VIEW;
    const dateStr = pathParts[2];
    
    let date = new Date();
    if (dateStr) {
      const parsedDate = parse(dateStr, URL_DATE_FORMAT, new Date());
      if (isValid(parsedDate)) {
        date = parsedDate;
      }
    }
    
    // Parse search parameters
    const searchParams = new URLSearchParams(urlObj.search);
    const filters = {};
    
    // Extract filters from search params
    ['priority', 'status', 'tags', 'projects', 'assignees'].forEach(key => {
      const value = searchParams.get(key);
      if (value) {
        filters[key] = value.split(',');
      }
    });
    
    // Extract date range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      filters.dateRange = { start: startDate, end: endDate };
    }
    
    return {
      view: Object.values(CALENDAR_VIEWS).includes(view) ? view : DEFAULT_VIEW,
      date,
      filters,
      selectedTaskId: searchParams.get('task'),
      searchQuery: searchParams.get('q') || ''
    };
  } catch (error) {
    //console.error('Failed to parse calendar URL:', error);
    return {
      view: DEFAULT_VIEW,
      date: new Date(),
      filters: {},
      selectedTaskId: null,
      searchQuery: ''
    };
  }
};

/**
 * Validate calendar route parameters
 * @param {Object} params - Route parameters
 * @returns {boolean} Whether parameters are valid
 */
export const validateCalendarParams = (params) => {
  const { view, date } = params;
  
  // Validate view
  if (view && !Object.values(CALENDAR_VIEWS).includes(view)) {
    return false;
  }
  
  // Validate date
  if (date) {
    const parsedDate = parse(date, URL_DATE_FORMAT, new Date());
    if (!isValid(parsedDate)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Get calendar navigation URLs
 * @param {string} view - Current view
 * @param {Date} date - Current date
 * @param {Object} options - Additional options
 * @returns {Object} Navigation URLs
 */
export const getCalendarNavigationUrls = (view, date, options = {}) => {
  const { filters = {} } = options;
  
  return {
    today: generateCalendarUrl(view, new Date(), { filters }),
    previous: generateCalendarUrl(view, getPreviousDate(view, date), { filters }),
    next: generateCalendarUrl(view, getNextDate(view, date), { filters })
  };
};

/**
 * Get previous date based on view
 * @param {string} view - Calendar view
 * @param {Date} date - Current date
 * @returns {Date} Previous date
 */
const getPreviousDate = (view, date) => {
  const newDate = new Date(date);
  
  switch (view) {
    case CALENDAR_VIEWS.DAY:
      newDate.setDate(newDate.getDate() - 1);
      break;
    case CALENDAR_VIEWS.WEEK:
      newDate.setDate(newDate.getDate() - 7);
      break;
    case CALENDAR_VIEWS.MONTH:
      newDate.setMonth(newDate.getMonth() - 1);
      break;
    case CALENDAR_VIEWS.AGENDA:
      newDate.setDate(newDate.getDate() - 7);
      break;
    default:
      break;
  }
  
  return newDate;
};

/**
 * Get next date based on view
 * @param {string} view - Calendar view
 * @param {Date} date - Current date
 * @returns {Date} Next date
 */
const getNextDate = (view, date) => {
  const newDate = new Date(date);
  
  switch (view) {
    case CALENDAR_VIEWS.DAY:
      newDate.setDate(newDate.getDate() + 1);
      break;
    case CALENDAR_VIEWS.WEEK:
      newDate.setDate(newDate.getDate() + 7);
      break;
    case CALENDAR_VIEWS.MONTH:
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    case CALENDAR_VIEWS.AGENDA:
      newDate.setDate(newDate.getDate() + 7);
      break;
    default:
      break;
  }
  
  return newDate;
};