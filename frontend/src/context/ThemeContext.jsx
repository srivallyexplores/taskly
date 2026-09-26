import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Theme types
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Initial state
const initialState = {
  theme: THEMES.SYSTEM,
  resolvedTheme: THEMES.LIGHT, // The actual theme being used
  systemTheme: THEMES.LIGHT,
  isLoading: false
};

// Action types
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_RESOLVED_THEME: 'SET_RESOLVED_THEME',
  SET_SYSTEM_THEME: 'SET_SYSTEM_THEME',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
    case THEME_ACTIONS.SET_RESOLVED_THEME:
      return {
        ...state,
        resolvedTheme: action.payload
      };
    case THEME_ACTIONS.SET_SYSTEM_THEME:
      return {
        ...state,
        systemTheme: action.payload
      };
    case THEME_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);
  const [storedTheme, setStoredTheme] = useLocalStorage('theme', THEMES.SYSTEM);

  // Initialize theme from localStorage
  useEffect(() => {
    if (storedTheme && Object.values(THEMES).includes(storedTheme)) {
      dispatch({ type: THEME_ACTIONS.SET_THEME, payload: storedTheme });
    }
  }, [storedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      const systemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      dispatch({ type: THEME_ACTIONS.SET_SYSTEM_THEME, payload: systemTheme });
    };

    // Set initial system theme
    handleSystemThemeChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Update resolved theme when theme or system theme changes
  useEffect(() => {
    let resolvedTheme;
    
    if (state.theme === THEMES.SYSTEM) {
      resolvedTheme = state.systemTheme;
    } else {
      resolvedTheme = state.theme;
    }

    dispatch({ type: THEME_ACTIONS.SET_RESOLVED_THEME, payload: resolvedTheme });
  }, [state.theme, state.systemTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(state.resolvedTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const themeColors = {
        [THEMES.LIGHT]: '#ffffff',
        [THEMES.DARK]: '#1f2937'
      };
      metaThemeColor.setAttribute('content', themeColors[state.resolvedTheme]);
    }
  }, [state.resolvedTheme]);

  // Theme actions
  const setTheme = (theme) => {
    if (!Object.values(THEMES).includes(theme)) {
      //console.warn(`Invalid theme: ${theme}`);
      return;
    }
    
    dispatch({ type: THEME_ACTIONS.SET_THEME, payload: theme });
    setStoredTheme(theme);
  };

  const toggleTheme = () => {
    const currentTheme = state.theme;
    let newTheme;
    
    if (currentTheme === THEMES.LIGHT) {
      newTheme = THEMES.DARK;
    } else if (currentTheme === THEMES.DARK) {
      newTheme = THEMES.SYSTEM;
    } else {
      newTheme = THEMES.LIGHT;
    }
    
    setTheme(newTheme);
  };

  const cycleTheme = () => {
    const themes = [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM];
    const currentIndex = themes.indexOf(state.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Utility functions
  const isDark = state.resolvedTheme === THEMES.DARK;
  const isLight = state.resolvedTheme === THEMES.LIGHT;
  const isSystemTheme = state.theme === THEMES.SYSTEM;

  const getThemeIcon = () => {
    switch (state.theme) {
      case THEMES.LIGHT:
        return 'sun';
      case THEMES.DARK:
        return 'moon';
      case THEMES.SYSTEM:
        return 'computer';
      default:
        return 'sun';
    }
  };

  const getThemeLabel = () => {
    switch (state.theme) {
      case THEMES.LIGHT:
        return 'Light';
      case THEMES.DARK:
        return 'Dark';
      case THEMES.SYSTEM:
        return 'System';
      default:
        return 'Light';
    }
  };

  const value = {
    // State
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    systemTheme: state.systemTheme,
    isLoading: state.isLoading,
    
    // Computed values
    isDark,
    isLight,
    isSystemTheme,
    
    // Actions
    setTheme,
    toggleTheme,
    cycleTheme,
    
    // Utilities
    getThemeIcon,
    getThemeLabel,
    
    // Constants
    THEMES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;