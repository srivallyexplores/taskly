import React, { useEffect, useCallback } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { useCalendarPreferences } from '../../hooks/useCalendarPreferences';

/**
 * Component that handles calendar view persistence and restoration
 * This component doesn't render anything but manages view state persistence
 */
const CalendarViewPersistence = () => {
  const { 
    currentView, 
    setCurrentView, 
    currentDate, 
    setCurrentDate,
    filters,
    setFilters
  } = useCalendar();
  
  const {
    preferences,
    updatePreference,
    updateNestedPreference,
    isLoading
  } = useCalendarPreferences();

  // Restore view state on component mount
  useEffect(() => {
    if (!isLoading && preferences) {
      // Restore last view if different from current
      if (preferences.lastView && preferences.lastView !== currentView) {
        setCurrentView(preferences.lastView);
      }
      
      // Restore last date if within reasonable range (last 30 days)
      if (preferences.lastDate) {
        const lastDate = new Date(preferences.lastDate);
        const now = new Date();
        const daysDiff = Math.abs((now - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 30 && !isNaN(lastDate.getTime())) {
          setCurrentDate(lastDate);
        }
      }
      
      // Restore filters if enabled
      if (preferences.saveFilters && preferences.lastFilters) {
        setFilters(preferences.lastFilters);
      }
    }
  }, [
    isLoading, 
    preferences, 
    currentView, 
    setCurrentView, 
    setCurrentDate, 
    setFilters
  ]);

  // Save view changes
  const saveViewState = useCallback(() => {
    if (!isLoading) {
      updatePreference('lastView', currentView);
      updatePreference('lastDate', currentDate.toISOString());
      
      if (preferences.saveFilters) {
        updatePreference('lastFilters', filters);
      }
    }
  }, [
    isLoading,
    currentView,
    currentDate,
    filters,
    preferences.saveFilters,
    updatePreference
  ]);

  // Save state when view changes
  useEffect(() => {
    const timeoutId = setTimeout(saveViewState, 500); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [saveViewState]);

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.calendarView) {
        const { view, date, filters: stateFilters } = event.state.calendarView;
        
        if (view) setCurrentView(view);
        if (date) setCurrentDate(new Date(date));
        if (stateFilters && preferences.saveFilters) {
          setFilters(stateFilters);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentView, setCurrentDate, setFilters, preferences.saveFilters]);

  // Update browser history when state changes
  useEffect(() => {
    if (!isLoading) {
      const state = {
        calendarView: {
          view: currentView,
          date: currentDate.toISOString(),
          filters: preferences.saveFilters ? filters : {}
        }
      };
      
      const url = new URL(window.location);
      url.searchParams.set('view', currentView);
      url.searchParams.set('date', currentDate.toISOString().split('T')[0]);
      
      if (preferences.saveFilters && Object.keys(filters).length > 0) {
        url.searchParams.set('filters', btoa(JSON.stringify(filters)));
      } else {
        url.searchParams.delete('filters');
      }
      
      // Only update if URL actually changed
      if (url.toString() !== window.location.toString()) {
        window.history.replaceState(state, '', url.toString());
      }
    }
  }, [currentView, currentDate, filters, preferences.saveFilters, isLoading]);

  // Parse URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const urlView = urlParams.get('view');
    const urlDate = urlParams.get('date');
    const urlFilters = urlParams.get('filters');
    
    if (urlView && ['month', 'week', 'day', 'agenda'].includes(urlView)) {
      setCurrentView(urlView);
    }
    
    if (urlDate) {
      const parsedDate = new Date(urlDate);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(parsedDate);
      }
    }
    
    if (urlFilters && preferences.saveFilters) {
      try {
        const parsedFilters = JSON.parse(atob(urlFilters));
        setFilters(parsedFilters);
      } catch (error) {
        //console.warn('Failed to parse URL filters:', error);
      }
    }
  }, [setCurrentView, setCurrentDate, setFilters, preferences.saveFilters]);

  // This component doesn't render anything
  return null;
};

export default CalendarViewPersistence;