import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook for managing calendar preferences and persistence
 */
export const useCalendarPreferences = () => {
  const { user } = useAuth();
  
  const [preferences, setPreferences] = useState({
    // View preferences
    defaultView: 'month',
    lastView: 'month',
    startOfWeek: 0, // 0 = Sunday, 1 = Monday
    timeFormat: '12h', // '12h' or '24h'
    dateFormat: 'MM/dd/yyyy',
    
    // Display preferences
    showWeekends: true,
    showWeekNumbers: false,
    compactMode: false,
    showTaskCount: true,
    showTaskPriority: true,
    showTaskStatus: true,
    
    // Task preferences
    defaultTaskDuration: 60, // minutes
    defaultTaskPriority: 'medium',
    autoScheduleTime: '09:00',
    taskOverlapHandling: 'stack', // 'stack', 'overlap', 'resize'
    
    // Notification preferences
    enableNotifications: true,
    notificationSound: true,
    reminderTimes: [15, 60, 1440], // minutes before due date
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    
    // Filter preferences
    defaultFilters: {},
    saveFilters: true,
    lastFilters: {},
    
    // Theme preferences
    theme: 'system', // 'light', 'dark', 'system'
    colorScheme: 'default',
    fontSize: 'medium',
    
    // Advanced preferences
    enableKeyboardShortcuts: true,
    enableDragAndDrop: true,
    enableQuickEdit: true,
    autoSave: true,
    syncAcrossDevices: true,
    
    // Calendar integration
    showHolidays: true,
    holidayRegion: 'US',
    workingHours: {
      enabled: true,
      start: '09:00',
      end: '17:00',
      workingDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    
    // Performance preferences
    lazyLoading: true,
    cacheSize: 50,
    prefetchDistance: 2 // months
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Get storage key for user preferences
  const getStorageKey = useCallback((key) => {
    const userId = user?.id || user?._id || 'anonymous';
    return `calendar_${key}_${userId}`;
  }, [user]);

  // Load preferences from localStorage and server
  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load from localStorage first (immediate)
      const localPrefs = localStorage.getItem(getStorageKey('preferences'));
      if (localPrefs) {
        const parsed = JSON.parse(localPrefs);
        setPreferences(prev => ({ ...prev, ...parsed }));
      }

      // Load from server if user is authenticated
      if (user) {
        try {
          const response = await fetch('/api/user/calendar-preferences', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const serverPrefs = await response.json();
            setPreferences(prev => ({ ...prev, ...serverPrefs }));
            // Update localStorage with server data
            localStorage.setItem(
              getStorageKey('preferences'), 
              JSON.stringify(serverPrefs)
            );
          }
        } catch (error) {
          //console.warn('Failed to load preferences from server:', error);
        }
      }
    } catch (error) {
      //console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getStorageKey]);

  // Save preferences to localStorage and server
  const savePreferences = useCallback(async (newPreferences) => {
    setIsSaving(true);
    try {
      // Save to localStorage immediately
      localStorage.setItem(
        getStorageKey('preferences'), 
        JSON.stringify(newPreferences)
      );

      // Save to server if user is authenticated
      if (user && newPreferences.syncAcrossDevices) {
        try {
          await fetch('/api/user/calendar-preferences', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newPreferences)
          });
        } catch (error) {
          //console.warn('Failed to save preferences to server:', error);
        }
      }
    } catch (error) {
      //console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, getStorageKey]);

  // Update specific preference
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, [key]: value };
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, [savePreferences]);

  // Update nested preference
  const updateNestedPreference = useCallback((path, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      const keys = path.split('.');
      let current = newPrefs;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, [savePreferences]);

  // Reset preferences to defaults
  const resetPreferences = useCallback(() => {
    const defaultPrefs = {
      defaultView: 'month',
      lastView: 'month',
      startOfWeek: 0,
      timeFormat: '12h',
      dateFormat: 'MM/dd/yyyy',
      showWeekends: true,
      showWeekNumbers: false,
      compactMode: false,
      showTaskCount: true,
      showTaskPriority: true,
      showTaskStatus: true,
      defaultTaskDuration: 60,
      defaultTaskPriority: 'medium',
      autoScheduleTime: '09:00',
      taskOverlapHandling: 'stack',
      enableNotifications: true,
      notificationSound: true,
      reminderTimes: [15, 60, 1440],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      defaultFilters: {},
      saveFilters: true,
      lastFilters: {},
      theme: 'system',
      colorScheme: 'default',
      fontSize: 'medium',
      enableKeyboardShortcuts: true,
      enableDragAndDrop: true,
      enableQuickEdit: true,
      autoSave: true,
      syncAcrossDevices: true,
      showHolidays: true,
      holidayRegion: 'US',
      workingHours: {
        enabled: true,
        start: '09:00',
        end: '17:00',
        workingDays: [1, 2, 3, 4, 5]
      },
      lazyLoading: true,
      cacheSize: 50,
      prefetchDistance: 2
    };
    
    setPreferences(defaultPrefs);
    savePreferences(defaultPrefs);
  }, [savePreferences]);

  // Export preferences
  const exportPreferences = useCallback(() => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-preferences-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [preferences]);

  // Import preferences
  const importPreferences = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedPrefs = JSON.parse(e.target.result);
          setPreferences(importedPrefs);
          savePreferences(importedPrefs);
          resolve(importedPrefs);
        } catch (error) {
          reject(new Error('Invalid preferences file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [savePreferences]);

  // Get preference by path
  const getPreference = useCallback((path, defaultValue = null) => {
    const keys = path.split('.');
    let current = preferences;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    return current;
  }, [preferences]);

  // Check if preference exists
  const hasPreference = useCallback((path) => {
    const keys = path.split('.');
    let current = preferences;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }
    return true;
  }, [preferences]);

  // Bulk update preferences
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, [savePreferences]);

  // Load preferences on mount and user change
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Auto-save preferences when they change
  useEffect(() => {
    if (!isLoading && preferences.autoSave) {
      const timeoutId = setTimeout(() => {
        savePreferences(preferences);
      }, 1000); // Debounce auto-save

      return () => clearTimeout(timeoutId);
    }
  }, [preferences, isLoading, savePreferences]);

  return {
    // State
    preferences,
    isLoading,
    isSaving,
    
    // Actions
    updatePreference,
    updateNestedPreference,
    updatePreferences,
    resetPreferences,
    
    // Utilities
    getPreference,
    hasPreference,
    
    // Import/Export
    exportPreferences,
    importPreferences,
    
    // Persistence
    loadPreferences,
    savePreferences
  };
};

export default useCalendarPreferences;