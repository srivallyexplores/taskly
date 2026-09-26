import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamAnalytics from '../../components/analytics/TeamAnalytics';

// Mock the context providers
const TeamProvider = ({ children, value }) => (
  <div data-testid="team-provider">{children}</div>
);

const ProjectProvider = ({ children, value }) => (
  <div data-testid="project-provider">{children}</div>
);

const mockTeamStats = {
  totalTasks: 50,
  completedTasks: 30,
  tasksByStatus: {
    'completed': 30,
    'in-progress': 15,
    'pending': 5
  },
  tasksByPriority: {
    'high': 20,
    'medium': 20,
    'low': 10
  },
  overdueTasks: 3,
  averageTaskTime: 2.5,
  completionTrend: 15,
  velocityTrend: 8,
  memberStats: {
    'user1': { completedTasks: 15, inProgressTasks: 5 },
    'user2': { completedTasks: 10, inProgressTasks: 8 },
    'user3': { completedTasks: 5, inProgressTasks: 2 }
  }
};

const mockTeamContext = {
  currentTeam: {
    _id: 'team1',
    name: 'Development Team',
    members: [
      { user: { _id: 'user1', name: 'John Doe' } },
      { user: { _id: 'user2', name: 'Jane Smith' } },
      { user: { _id: 'user3', name: 'Bob Wilson' } }
    ]
  },
  teamStats: mockTeamStats,
  loading: { currentTeam: false, stats: false },
  errors: {},
  fetchTeam: vi.fn(),
  fetchTeamStats: vi.fn()
};

const mockProjectContext = {
  projects: [
    { _id: 'project1', name: 'Web App', status: 'active' },
    { _id: 'project2', name: 'Mobile App', status: 'active' }
  ],
  fetchProjects: vi.fn()
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <TeamProvider value={mockTeamContext}>
        <ProjectProvider value={mockProjectContext}>
          {component}
        </ProjectProvider>
      </TeamProvider>
    </BrowserRouter>
  );
};

describe('TeamAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders analytics dashboard with team information', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    expect(screen.getByText('Team Analytics')).toBeInTheDocument();
  });

  test('displays overview statistics correctly', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    // Should show completion rate (30/50 = 60%)
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  test('handles loading state', () => {
    const loadingContext = {
      ...mockTeamContext,
      loading: { currentTeam: true, stats: true }
    };
    
    render(
      <BrowserRouter>
        <TeamProvider value={loadingContext}>
          <ProjectProvider value={mockProjectContext}>
            <TeamAnalytics teamId="team1" />
          </ProjectProvider>
        </TeamProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('fetches data on mount', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    expect(mockTeamContext.fetchTeam).toHaveBeenCalledWith('team1');
    expect(mockTeamContext.fetchTeamStats).toHaveBeenCalledWith('team1', { timeRange: '30d' });
  });
});