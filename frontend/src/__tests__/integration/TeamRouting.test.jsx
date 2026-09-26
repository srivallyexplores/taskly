import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { TeamProvider } from '../../context/TeamContext';
import { ProjectProvider } from '../../context/ProjectContext';
import App from '../../App';

// Mock the contexts
const mockAuthContext = {
  user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
  isAuthenticated: true,
  loading: false
};

const mockTeamContext = {
  teams: [
    { _id: 'team1', name: 'Development Team' },
    { _id: 'team2', name: 'Design Team' }
  ],
  currentTeam: {
    _id: 'team1',
    name: 'Development Team',
    members: [
      { user: { _id: 'user1', name: 'John Doe' }, role: 'admin' }
    ]
  },
  canPerformAction: jest.fn(() => true),
  fetchTeam: jest.fn(),
  fetchTeams: jest.fn(),
  loading: { currentTeam: false, teams: false },
  errors: {}
};

const mockProjectContext = {
  projects: [
    { _id: 'project1', name: 'Web App', team: { _id: 'team1' } },
    { _id: 'project2', name: 'Mobile App', team: { _id: 'team2' } }
  ],
  currentProject: {
    _id: 'project1',
    name: 'Web App',
    members: [
      { user: { _id: 'user1', name: 'John Doe' }, role: 'admin' }
    ]
  },
  canPerformAction: jest.fn(() => true),
  fetchProject: jest.fn(),
  fetchProjects: jest.fn(),
  loading: { currentProject: false, projects: false },
  errors: {}
};

const renderWithProviders = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider value={mockAuthContext}>
        <TeamProvider value={mockTeamContext}>
          <ProjectProvider value={mockProjectContext}>
            <App />
          </ProjectProvider>
        </TeamProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Team Routing Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('navigates to teams page', async () => {
    renderWithProviders(['/teams']);
    
    await waitFor(() => {
      expect(screen.getByText(/teams/i)).toBeInTheDocument();
    });
  });

  test('navigates to specific team dashboard', async () => {
    renderWithProviders(['/teams/team1']);
    
    await waitFor(() => {
      expect(mockTeamContext.fetchTeam).toHaveBeenCalledWith('team1');
    });
  });

  test('navigates to team settings with proper permissions', async () => {
    renderWithProviders(['/teams/team1/settings']);
    
    await waitFor(() => {
      expect(mockTeamContext.fetchTeam).toHaveBeenCalledWith('team1');
      expect(mockTeamContext.canPerformAction).toHaveBeenCalledWith('team1', 'manage_team_settings');
    });
  });

  test('navigates to team analytics', async () => {
    renderWithProviders(['/teams/team1/analytics']);
    
    await waitFor(() => {
      expect(mockTeamContext.fetchTeam).toHaveBeenCalledWith('team1');
    });
  });

  test('navigates to project dashboard', async () => {
    renderWithProviders(['/projects/project1']);
    
    await waitFor(() => {
      expect(mockProjectContext.fetchProject).toHaveBeenCalledWith('project1');
    });
  });

  test('navigates to project settings with proper permissions', async () => {
    renderWithProviders(['/projects/project1/settings']);
    
    await waitFor(() => {
      expect(mockProjectContext.fetchProject).toHaveBeenCalledWith('project1');
      expect(mockProjectContext.canPerformAction).toHaveBeenCalledWith('project1', 'manage_project_settings');
    });
  });

  test('navigates to project tasks', async () => {
    renderWithProviders(['/projects/project1/tasks']);
    
    await waitFor(() => {
      expect(mockProjectContext.fetchProject).toHaveBeenCalledWith('project1');
    });
  });

  test('handles join team route', async () => {
    renderWithProviders(['/join/ABC123']);
    
    await waitFor(() => {
      expect(screen.getByText(/join/i)).toBeInTheDocument();
    });
  });

  test('redirects unauthenticated users to login', async () => {
    const unauthenticatedContext = {
      ...mockAuthContext,
      user: null,
      isAuthenticated: false
    };
    
    render(
      <MemoryRouter initialEntries={['/teams/team1']}>
        <AuthProvider value={unauthenticatedContext}>
          <TeamProvider value={mockTeamContext}>
            <ProjectProvider value={mockProjectContext}>
              <App />
            </ProjectProvider>
          </TeamProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  test('redirects to teams page when team not found', async () => {
    const errorTeamContext = {
      ...mockTeamContext,
      currentTeam: null,
      errors: { currentTeam: 'Team not found' }
    };
    
    render(
      <MemoryRouter initialEntries={['/teams/nonexistent']}>
        <AuthProvider value={mockAuthContext}>
          <TeamProvider value={errorTeamContext}>
            <ProjectProvider value={mockProjectContext}>
              <App />
            </ProjectProvider>
          </TeamProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/team not found/i)).toBeInTheDocument();
    });
  });

  test('redirects when user lacks team permissions', async () => {
    const restrictedTeamContext = {
      ...mockTeamContext,
      canPerformAction: jest.fn(() => false)
    };
    
    render(
      <MemoryRouter initialEntries={['/teams/team1/settings']}>
        <AuthProvider value={mockAuthContext}>
          <TeamProvider value={restrictedTeamContext}>
            <ProjectProvider value={mockProjectContext}>
              <App />
            </ProjectProvider>
          </TeamProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/permission/i)).toBeInTheDocument();
    });
  });

  test('handles catch-all route redirect', async () => {
    renderWithProviders(['/nonexistent-route']);
    
    await waitFor(() => {
      // Should redirect to home page
      expect(window.location.pathname).toBe('/');
    });
  });
});