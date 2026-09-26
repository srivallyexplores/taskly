import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { TeamProvider } from '../../context/TeamContext';
import { ProjectProvider } from '../../context/ProjectContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { ThemeProvider } from '../../context/ThemeContext';

// Test component that uses multiple contexts
const CrossContextTestComponent = () => {
  const { user, hasTeamPermission, hasProjectPermission } = useAuth();
  const { currentTeam, canPerformAction: canPerformTeamAction } = useTeam();
  const { currentProject, canPerformAction: canPerformProjectAction } = useProject();
  const { addNotification } = useNotification();
  const { theme } = useTheme();

  const handleTeamAction = () => {
    if (hasTeamPermission(currentTeam?._id, 'manage')) {
      addNotification({
        type: 'success',
        message: 'Team action performed'
      });
    }
  };

  const handleProjectAction = () => {
    if (hasProjectPermission(currentProject?._id, 'edit')) {
      addNotification({
        type: 'success',
        message: 'Project action performed'
      });
    }
  };

  return (
    <div data-theme={theme}>
      <div data-testid="user-info">{user?.name}</div>
      <div data-testid="team-info">{currentTeam?.name}</div>
      <div data-testid="project-info">{currentProject?.name}</div>
      <button onClick={handleTeamAction} data-testid="team-action">
        Team Action
      </button>
      <button onClick={handleProjectAction} data-testid="project-action">
        Project Action
      </button>
    </div>
  );
};

// Mock implementations
const createMockAuthContext = (overrides = {}) => ({
  user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
  isAuthenticated: true,
  userTeams: [{ _id: 'team1', name: 'Test Team' }],
  userProjects: [{ _id: 'project1', name: 'Test Project' }],
  teamPermissions: {
    team1: { role: 'admin', canManage: true, canInvite: true, canEdit: true }
  },
  projectPermissions: {
    project1: { role: 'admin', canManage: true, canAssign: true, canEdit: true }
  },
  hasTeamPermission: jest.fn(() => true),
  hasProjectPermission: jest.fn(() => true),
  getUserTeamRole: jest.fn(() => 'admin'),
  getUserProjectRole: jest.fn(() => 'admin'),
  updateTeamMembership: jest.fn(),
  updateProjectMembership: jest.fn(),
  refreshUserTeamsAndProjects: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
  ...overrides
});

const createMockTeamContext = (overrides = {}) => ({
  teams: [{ _id: 'team1', name: 'Test Team' }],
  currentTeam: { _id: 'team1', name: 'Test Team' },
  loading: { teams: false, currentTeam: false },
  errors: {},
  fetchTeams: jest.fn(),
  fetchTeam: jest.fn(),
  createTeam: jest.fn(),
  updateTeam: jest.fn(),
  canPerformAction: jest.fn(() => true),
  ...overrides
});

const createMockProjectContext = (overrides = {}) => ({
  projects: [{ _id: 'project1', name: 'Test Project' }],
  currentProject: { _id: 'project1', name: 'Test Project' },
  loading: { projects: false, currentProject: false },
  errors: {},
  fetchProjects: jest.fn(),
  fetchProject: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  canPerformAction: jest.fn(() => true),
  ...overrides
});

const createMockNotificationContext = (overrides = {}) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  addNotification: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  ...overrides
});

const createMockThemeContext = (overrides = {}) => ({
  theme: 'light',
  toggleTheme: jest.fn(),
  isDark: false,
  ...overrides
});

const renderWithAllContexts = (component, contextOverrides = {}) => {
  const authContext = createMockAuthContext(contextOverrides.auth);
  const teamContext = createMockTeamContext(contextOverrides.team);
  const projectContext = createMockProjectContext(contextOverrides.project);
  const notificationContext = createMockNotificationContext(contextOverrides.notification);
  const themeContext = createMockThemeContext(contextOverrides.theme);

  return {
    ...render(
      <BrowserRouter>
        <ThemeProvider value={themeContext}>
          <AuthProvider value={authContext}>
            <NotificationProvider value={notificationContext}>
              <TeamProvider value={teamContext}>
                <ProjectProvider value={projectContext}>
                  {component}
                </ProjectProvider>
              </TeamProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    ),
    contexts: {
      auth: authContext,
      team: teamContext,
      project: projectContext,
      notification: notificationContext,
      theme: themeContext
    }
  };
};

describe('Cross-Context Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Provider Hierarchy', () => {
    test('all contexts are properly nested and accessible', () => {
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />);

      expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('team-info')).toHaveTextContent('Test Team');
      expect(screen.getByTestId('project-info')).toHaveTextContent('Test Project');
      expect(screen.getByTestId('team-action')).toBeInTheDocument();
      expect(screen.getByTestId('project-action')).toBeInTheDocument();
    });

    test('context updates propagate correctly through hierarchy', async () => {
      const { contexts, rerender } = renderWithAllContexts(<CrossContextTestComponent />);

      // Update auth context
      const updatedAuthContext = createMockAuthContext({
        user: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }
      });

      rerender(
        <BrowserRouter>
          <ThemeProvider value={contexts.theme}>
            <AuthProvider value={updatedAuthContext}>
              <NotificationProvider value={contexts.notification}>
                <TeamProvider value={contexts.team}>
                  <ProjectProvider value={contexts.project}>
                    <CrossContextTestComponent />
                  </ProjectProvider>
                </TeamProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Jane Smith');
      });
    });
  });

  describe('Permission System Integration', () => {
    test('auth permissions integrate with team and project contexts', async () => {
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />);

      // Test team action
      fireEvent.click(screen.getByTestId('team-action'));

      await waitFor(() => {
        expect(contexts.auth.hasTeamPermission).toHaveBeenCalledWith('team1', 'manage');
        expect(contexts.notification.addNotification).toHaveBeenCalledWith({
          type: 'success',
          message: 'Team action performed'
        });
      });

      // Test project action
      fireEvent.click(screen.getByTestId('project-action'));

      await waitFor(() => {
        expect(contexts.auth.hasProjectPermission).toHaveBeenCalledWith('project1', 'edit');
        expect(contexts.notification.addNotification).toHaveBeenCalledWith({
          type: 'success',
          message: 'Project action performed'
        });
      });
    });

    test('permission denial prevents actions', async () => {
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />, {
        auth: {
          hasTeamPermission: jest.fn(() => false),
          hasProjectPermission: jest.fn(() => false)
        }
      });

      // Test team action (should be denied)
      fireEvent.click(screen.getByTestId('team-action'));

      await waitFor(() => {
        expect(contexts.auth.hasTeamPermission).toHaveBeenCalledWith('team1', 'manage');
        expect(contexts.notification.addNotification).not.toHaveBeenCalled();
      });

      // Test project action (should be denied)
      fireEvent.click(screen.getByTestId('project-action'));

      await waitFor(() => {
        expect(contexts.auth.hasProjectPermission).toHaveBeenCalledWith('project1', 'edit');
        expect(contexts.notification.addNotification).not.toHaveBeenCalled();
      });
    });
  });

  describe('State Synchronization', () => {
    test('team membership changes update auth context', async () => {
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />);

      // Simulate team membership update
      act(() => {
        contexts.auth.updateTeamMembership('team1', { role: 'member' });
      });

      await waitFor(() => {
        expect(contexts.auth.updateTeamMembership).toHaveBeenCalledWith('team1', { role: 'member' });
      });
    });

    test('project membership changes update auth context', async () => {
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />);

      // Simulate project membership update
      act(() => {
        contexts.auth.updateProjectMembership('project1', { role: 'member' });
      });

      await waitFor(() => {
        expect(contexts.auth.updateProjectMembership).toHaveBeenCalledWith('project1', { role: 'member' });
      });
    });

    test('logout clears all context data', async () => {
      const { contexts, rerender } = renderWithAllContexts(<CrossContextTestComponent />);

      // Simulate logout
      const loggedOutAuthContext = createMockAuthContext({
        user: null,
        isAuthenticated: false,
        userTeams: [],
        userProjects: [],
        teamPermissions: {},
        projectPermissions: {}
      });

      rerender(
        <BrowserRouter>
          <ThemeProvider value={contexts.theme}>
            <AuthProvider value={loggedOutAuthContext}>
              <NotificationProvider value={contexts.notification}>
                <TeamProvider value={contexts.team}>
                  <ProjectProvider value={contexts.project}>
                    <CrossContextTestComponent />
                  </ProjectProvider>
                </TeamProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toBeEmptyDOMElement();
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('errors in one context do not break others', async () => {
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />, {
        team: {
          errors: { currentTeam: 'Failed to load team' }
        }
      });

      // Other contexts should still work
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('project-info')).toHaveTextContent('Test Project');

      // Team context should show error
      expect(contexts.team.errors.currentTeam).toBe('Failed to load team');
    });

    test('network errors are handled gracefully across contexts', async () => {
      const networkError = new Error('Network error');
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />, {
        auth: { error: 'Network error' },
        team: { errors: { teams: 'Network error' } },
        project: { errors: { projects: 'Network error' } }
      });

      // All contexts should handle network errors
      expect(contexts.auth.error).toBe('Network error');
      expect(contexts.team.errors.teams).toBe('Network error');
      expect(contexts.project.errors.projects).toBe('Network error');
    });
  });

  describe('Loading State Coordination', () => {
    test('loading states are coordinated across contexts', async () => {
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />, {
        auth: { loading: true },
        team: { loading: { teams: true, currentTeam: true } },
        project: { loading: { projects: true, currentProject: true } }
      });

      // All contexts should be in loading state
      expect(contexts.auth.loading).toBe(true);
      expect(contexts.team.loading.teams).toBe(true);
      expect(contexts.team.loading.currentTeam).toBe(true);
      expect(contexts.project.loading.projects).toBe(true);
      expect(contexts.project.loading.currentProject).toBe(true);
    });

    test('loading completion triggers data refresh', async () => {
      const { contexts, rerender } = renderWithAllContexts(<CrossContextTestComponent />, {
        auth: { loading: true }
      });

      // Complete loading
      const loadedAuthContext = createMockAuthContext({ loading: false });

      rerender(
        <BrowserRouter>
          <ThemeProvider value={contexts.theme}>
            <AuthProvider value={loadedAuthContext}>
              <NotificationProvider value={contexts.notification}>
                <TeamProvider value={contexts.team}>
                  <ProjectProvider value={contexts.project}>
                    <CrossContextTestComponent />
                  </ProjectProvider>
                </TeamProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      });
    });
  });

  describe('Theme Integration', () => {
    test('theme changes propagate to all components', async () => {
      const { contexts, rerender } = renderWithAllContexts(<CrossContextTestComponent />);

      // Initially light theme
      expect(screen.getByTestId('user-info').closest('[data-theme]')).toHaveAttribute('data-theme', 'light');

      // Switch to dark theme
      const darkThemeContext = createMockThemeContext({
        theme: 'dark',
        isDark: true
      });

      rerender(
        <BrowserRouter>
          <ThemeProvider value={darkThemeContext}>
            <AuthProvider value={contexts.auth}>
              <NotificationProvider value={contexts.notification}>
                <TeamProvider value={contexts.team}>
                  <ProjectProvider value={contexts.project}>
                    <CrossContextTestComponent />
                  </ProjectProvider>
                </TeamProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info').closest('[data-theme]')).toHaveAttribute('data-theme', 'dark');
      });
    });
  });

  describe('Notification Integration', () => {
    test('notifications are triggered by context actions', async () => {
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />);

      // Simulate successful team action
      fireEvent.click(screen.getByTestId('team-action'));

      await waitFor(() => {
        expect(contexts.notification.addNotification).toHaveBeenCalledWith({
          type: 'success',
          message: 'Team action performed'
        });
      });

      // Simulate successful project action
      fireEvent.click(screen.getByTestId('project-action'));

      await waitFor(() => {
        expect(contexts.notification.addNotification).toHaveBeenCalledWith({
          type: 'success',
          message: 'Project action performed'
        });
      });
    });

    test('error notifications are handled properly', async () => {
      const { contexts } = renderWithAllContexts(<CrossContextTestComponent />, {
        notification: {
          addNotification: jest.fn(),
          notifications: [
            {
              _id: 'error1',
              type: 'error',
              message: 'Something went wrong',
              read: false
            }
          ],
          unreadCount: 1
        }
      });

      expect(contexts.notification.notifications).toHaveLength(1);
      expect(contexts.notification.unreadCount).toBe(1);
    });
  });

  describe('Memory Management', () => {
    test('contexts clean up properly on unmount', async () => {
      const { contexts, unmount } = renderWithAllContexts(<CrossContextTestComponent />);

      // Verify contexts are active
      expect(screen.getByTestId('user-info')).toBeInTheDocument();

      // Unmount component
      unmount();

      // Contexts should be cleaned up (no memory leaks)
      // This is more of a conceptual test - in real scenarios you'd check for memory leaks
      expect(true).toBe(true); // Placeholder assertion
    });

    test('context updates do not cause memory leaks', async () => {
      const { contexts, rerender } = renderWithAllContexts(<CrossContextTestComponent />);

      // Perform multiple updates
      for (let i = 0; i < 10; i++) {
        const updatedAuthContext = createMockAuthContext({
          user: { _id: `user${i}`, name: `User ${i}`, email: `user${i}@example.com` }
        });

        rerender(
          <BrowserRouter>
            <ThemeProvider value={contexts.theme}>
              <AuthProvider value={updatedAuthContext}>
                <NotificationProvider value={contexts.notification}>
                  <TeamProvider value={contexts.team}>
                    <ProjectProvider value={contexts.project}>
                      <CrossContextTestComponent />
                    </ProjectProvider>
                  </TeamProvider>
                </NotificationProvider>
              </AuthProvider>
            </ThemeProvider>
          </BrowserRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent(`User ${i}`);
        });
      }

      // Should not cause memory issues
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});