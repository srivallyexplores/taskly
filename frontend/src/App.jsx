import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Navigation from './components/layout/Navigation';
import { LoadingSpinner } from './components/ui/LoadingStates';
import ErrorBoundary from './components/error/ErrorBoundary';
import OnboardingFlow from './components/onboarding/OnboardingFlow';


// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorProvider } from './context/ErrorContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { AppStateProvider } from './context/AppStateContext';
import { TeamProvider, useTeam } from './context/TeamContext';
import { TaskProvider } from './context/TaskContext';
import { ProjectProvider } from './context/ProjectContext';
import { CalendarProvider } from './context/CalendarContext';

// Lazy-loaded pages
const Home = React.lazy(() => import('./pages/Home'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Projects = React.lazy(() => import('./pages/Projects'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Teams = React.lazy(() => import('./pages/Teams'));
const TeamDashboard = React.lazy(() => import('./pages/TeamDashboard'));
const TeamSettings = React.lazy(() => import('./pages/TeamSettings'));
const ProjectDashboard = React.lazy(() => import('./pages/ProjectDashboard'));
const ProjectSettings = React.lazy(() => import('./pages/ProjectSettings'));
const JoinTeam = React.lazy(() => import('./pages/JoinTeam'));
const Invitations = React.lazy(() => import('./pages/Invitations'));
const FindUsers = React.lazy(() => import('./pages/FindUsers'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Team Protected Route Component
const TeamProtectedRoute = ({ children, teamId, requiredRole = null }) => {
  const { user, loading } = useAuth();
  const { currentTeam, canPerformAction } = useTeam();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is member of the team
  if (teamId && currentTeam?._id !== teamId) {
    const isMember = currentTeam?.members?.some(member => member.user._id === user._id);
    if (!isMember) {
      return <Navigate to="/teams" replace />;
    }
  }

  // Check required role if specified
  if (requiredRole && !canPerformAction(teamId, requiredRole)) {
    return <Navigate to={`/teams/${teamId}`} replace />;
  }

  return children;
};

// Main App Layout
const AppLayout = ({ children }) => {
  const { theme } = useTheme();



  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 transition-colors duration-200">
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <Navigation />
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            }>
              {children}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            maxWidth: '500px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#059669',
              color: '#ffffff',
              border: '1px solid #10b981',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#059669',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#dc2626',
              color: '#ffffff',
              border: '1px solid #ef4444',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#dc2626',
            },
          },
        }}
      />

      {/* Onboarding Flow */}
      <OnboardingFlow />
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <ErrorProvider>
            <AuthProvider>
              <AnalyticsProvider>
                <AppStateProvider>
                  <TeamProvider>
                    <TaskProvider>
                      <ProjectProvider>
                        <CalendarProvider>
                          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                            <div className="App">
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <Home />
                          </Suspense>
                        } />
                        <Route path="/login" element={
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <Login />
                          </Suspense>
                        } />
                        <Route path="/signup" element={
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <Signup />
                          </Suspense>
                        } />
                        <Route path="/forgot-password" element={
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <ForgotPassword />
                          </Suspense>
                        } />
                        <Route path="/reset-password/:token" element={
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <ResetPassword />
                          </Suspense>
                        } />

                        {/* Protected Routes */}
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Dashboard />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/tasks" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Tasks />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/projects" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Projects />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/analytics" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Analytics />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Profile />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Settings />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/calendar" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Calendar />
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/calendar/:view" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Calendar />
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/calendar/:view/:date" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Calendar />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        {/* Invitations Route */}
                        <Route path="/invitations" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Invitations />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        {/* Find Users Route */}
                        <Route path="/find-users" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <FindUsers />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        {/* Team Routes */}
                        <Route path="/teams" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Teams />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/teams/:teamId" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <TeamDashboard />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/teams/:teamId/settings" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <TeamSettings />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/teams/:teamId/analytics" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Analytics />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        {/* Project Routes */}
                        <Route path="/projects/:projectId" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <ProjectDashboard />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/projects/:projectId/settings" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <ProjectSettings />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/projects/:projectId/tasks" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Tasks />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        <Route path="/projects/:projectId/analytics" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Analytics />
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        {/* Public Team Join Route */}
                        <Route path="/join/:inviteCode" element={
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <JoinTeam />
                          </Suspense>
                        } />

                        {/* Catch all route - redirect to dashboard if logged in, home if not */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                        </div>
                          </Router>
                        </CalendarProvider>
                      </ProjectProvider>
                    </TaskProvider>
                  </TeamProvider>
                </AppStateProvider>
              </AnalyticsProvider>
            </AuthProvider>
          </ErrorProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;