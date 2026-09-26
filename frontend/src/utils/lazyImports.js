import { lazy } from 'react';

// Lazy load pages with better error handling
const createLazyComponent = (importFn, fallback = null) => {
  const LazyComponent = lazy(importFn);
  
  // Add display name for better debugging
  LazyComponent.displayName = importFn.toString().match(/import\(['"`](.+)['"`]\)/)?.[1] || 'LazyComponent';
  
  return LazyComponent;
};

// Core pages
export const Dashboard = createLazyComponent(() => import('../pages/Dashboard'));
export const Tasks = createLazyComponent(() => import('../pages/Tasks'));
export const Projects = createLazyComponent(() => import('../pages/Projects'));
export const Analytics = createLazyComponent(() => import('../pages/Analytics'));
export const Profile = createLazyComponent(() => import('../pages/Profile'));
export const Settings = createLazyComponent(() => import('../pages/Settings'));

// Auth pages
export const Login = createLazyComponent(() => import('../pages/Login'));
export const Signup = createLazyComponent(() => import('../pages/Signup'));

// Feature-specific components (loaded on demand)
export const TaskBoard = createLazyComponent(() => import('../components/tasks/TaskBoard'));
export const TaskCalendar = createLazyComponent(() => import('../components/tasks/TaskCalendar'));
export const TaskTimeline = createLazyComponent(() => import('../components/tasks/TaskTimeline'));

// Utility function to preload components
export const preloadComponent = (componentImport) => {
  if (typeof componentImport === 'function') {
    componentImport();
  }
};

// Preload critical components on idle
export const preloadCriticalComponents = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponent(() => import('../components/tasks/TaskBoard'));
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadComponent(() => import('../components/tasks/TaskBoard'));
    }, 2000);
  }
};

export default {
  Dashboard,
  Tasks,
  Projects,
  Analytics,
  Profile,
  Settings,
  Login,
  Signup,
  TaskBoard,
  TaskCalendar,
  TaskTimeline,
  preloadComponent,
  preloadCriticalComponents
};