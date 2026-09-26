import { useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useCalendar } from '../context/CalendarContext';
import { 
  parseCalendarParams, 
  updateCalendarUrl, 
  validateCalendarParams,
  DEFAULT_VIEW,
  getShareableCalendarUrl
} from '../utils/calendarRouting';

/**
 * Custom hook for managing calendar URL state and navigation
 */
export const useCalendarRouting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    currentView,
    setView,
    currentDate,
    setCurrentDate,
    filters,
    updateFilter,
    clearFilters,
    allTasks
  } = useCalendar();

  // Parse current URL state
  const urlState = parseCalendarParams(params, searchParams);

  // Update URL when calendar state changes
  const updateUrl = useCallback((options = {}) => {
    const { replace = true, preserveFilters = true } = options;
    
    updateCalendarUrl(navigate, currentView, currentDate, {
      filters: preserveFilters ? filters : {},
      replace
    });
  }, [navigate, currentView, currentDate, filters]);

  // Navigate to specific calendar state
  const navigateToCalendar = useCallback((view, date, options = {}) => {
    const { filters: newFilters = {}, replace = false } = options;
    
    updateCalendarUrl(navigate, view, date, {
      filters: newFilters,
      replace
    });
  }, [navigate]);

  // Navigate to task
  const navigateToTask = useCallback((taskId, options = {}) => {
    const { replace = false } = options;
    
    updateCalendarUrl(navigate, currentView, currentDate, {
      filters,
      selectedTaskId: taskId,
      replace
    });
  }, [navigate, currentView, currentDate, filters]);

  // Get shareable URL
  const getShareableUrl = useCallback(() => {
    return getShareableCalendarUrl(currentView, currentDate, filters);
  }, [currentView, currentDate, filters]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Re-parse URL state when user navigates with browser buttons
      const newUrlState = parseCalendarParams(params, searchParams);
      
      if (newUrlState.view !== currentView) {
        setView(newUrlState.view);
      }
      
      if (newUrlState.date.getTime() !== currentDate.getTime()) {
        setCurrentDate(newUrlState.date);
      }
      
      // Apply filters from URL
      Object.entries(newUrlState.filters).forEach(([filterType, filterValue]) => {
        updateFilter(filterType, filterValue);
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [params, searchParams, currentView, currentDate, setView, setCurrentDate, updateFilter]);

  // Validate current URL and redirect if invalid
  useEffect(() => {
    if (!validateCalendarParams(params)) {
      updateCalendarUrl(navigate, DEFAULT_VIEW, new Date(), { replace: true });
    }
  }, [params, navigate]);

  // Sync URL with calendar state changes
  useEffect(() => {
    // Only update URL if the current URL doesn't match the calendar state
    const currentUrlState = parseCalendarParams(params, searchParams);
    
    const needsUpdate = 
      currentUrlState.view !== currentView ||
      currentUrlState.date.getTime() !== currentDate.getTime() ||
      JSON.stringify(currentUrlState.filters) !== JSON.stringify(filters);
    
    if (needsUpdate) {
      updateUrl({ replace: true });
    }
  }, [currentView, currentDate, filters, params, searchParams, updateUrl]);

  return {
    // Current URL state
    urlState,
    
    // Navigation functions
    updateUrl,
    navigateToCalendar,
    navigateToTask,
    
    // Utility functions
    getShareableUrl,
    
    // URL validation
    isValidUrl: validateCalendarParams(params)
  };
};

/**
 * Hook for calendar deep linking support
 */
export const useCalendarDeepLink = () => {
  const { allTasks } = useCalendar();
  const { urlState, navigateToTask } = useCalendarRouting();

  // Handle deep link to specific task
  useEffect(() => {
    if (urlState.selectedTaskId && allTasks.length > 0) {
      const task = allTasks.find(t => t._id === urlState.selectedTaskId);
      if (task) {
        // Task found - could trigger task modal or selection
        return task;
      } else {
        // Task not found - remove from URL
        navigateToTask(null, { replace: true });
      }
    }
  }, [urlState.selectedTaskId, allTasks, navigateToTask]);

  return {
    selectedTaskId: urlState.selectedTaskId,
    searchQuery: urlState.searchQuery
  };
};

/**
 * Hook for calendar URL sharing
 */
export const useCalendarSharing = () => {
  const { getShareableUrl } = useCalendarRouting();
  const { currentView, currentDate, filters } = useCalendar();

  // Copy shareable URL to clipboard
  const copyShareableUrl = useCallback(async () => {
    try {
      const url = getShareableUrl();
      await navigator.clipboard.writeText(url);
      return { success: true, url };
    } catch (error) {
      //console.error('Failed to copy URL:', error);
      return { success: false, error: error.message };
    }
  }, [getShareableUrl]);

  // Generate different sharing formats
  const getShareableLinks = useCallback(() => {
    const baseUrl = getShareableUrl();
    
    return {
      direct: baseUrl,
      email: `mailto:?subject=Calendar View&body=Check out this calendar view: ${baseUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=Check out this calendar view&url=${encodeURIComponent(baseUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}`
    };
  }, [getShareableUrl]);

  return {
    copyShareableUrl,
    getShareableLinks,
    shareableUrl: getShareableUrl()
  };
};

export default useCalendarRouting;