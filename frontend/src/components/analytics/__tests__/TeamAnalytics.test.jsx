import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamAnalytics from '../TeamAnalytics';
import { TeamProvider } from '../../../context/TeamContext';
import { ProjectProvider } from '../../../context/ProjectContext';

const mockTeamContext = {
  currentTeam: {
    _id: 'team1',
    name: 'Development Team',
    members: [
      { user: { _id: 'user1', name: 'John Doe' }, role: 'admin' },
      { user: { _id: 'user2', name: 'Jane Smith' }, role: 'member' }
    ]
  },
  teamStats: {
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
    averageTaskTime: 3.5,
    overdueTasks: 3,
    completionTrend: 15,
    velocityTrend: 8,
    commentsPerTask: 2.3,
    collaborationScore: 85,
    mentionsCount: 45,
    activeDiscussions: 12,
    averageResponseTime: 2.1,
    burndownData: {
      ideal: [50, 45, 40, 35, 30, 25, 20],
      actual: [50, 43, 38, 32, 28, 22, 18]
    },
    memberStats: {
      'user1': { completedTasks: 18, inProgressTasks: 8 },
      'user2': { completedTasks: 12, inProgressTasks: 7 }
    },
    weeklyData: [
      { week: '2024-01-01', completed: 8, created: 10 },
      { week: '2024-01-08', completed: 12, created: 8 },
      { week: '2024-01-15', completed: 10, created: 12 }
    ],
    memberActivity: [
      {
        name: 'John Doe',
        tasksCompleted: 18,
        commentsMade: 25,
        projectsActive: 3,
        collaborationScore: 90,
        responseTime: 1.8
      },
      {
        name: 'Jane Smith',
        tasksCompleted: 12,
        commentsMade: 18,
        projectsActive: 2,
        collaborationScore: 80,
        responseTime: 2.4
      }
    ]
  },
  teamActivity: [
    {
      _id: 'activity1',
      type: 'task_completed',
      user: { name: 'John Doe' },
      description: 'Completed task "Fix login bug"',
      createdAt: new Date()
    }
  ],
  loading: { currentTeam: false, stats: false, activity: false },
  errors: {},
  fetchTeam: jest.fn(),
  fetchTeamStats: jest.fn(),
  fetchTeamActivity: jest.fn()
};

const mockProjectContext = {
  projects: [
    { _id: 'project1', name: 'Web App', status: 'active' },
    { _id: 'project2', name: 'Mobile App', status: 'active' }
  ],
  fetchProjects: jest.fn()
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

describe('TeamAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders team analytics dashboard', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    expect(screen.getByText('Development Team - Performance insights and metrics')).toBeInTheDocument();
  });

  test('displays overview statistics correctly', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Team members
    expect(screen.getByText('2')).toBeInTheDocument(); // Active projects
    expect(screen.getByText('60%')).toBeInTheDocument(); // Completion rate
    expect(screen.getByText('3')).toBeInTheDocument(); // Overdue tasks
  });

  test('switches between metric tabs', async () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    // Default should be productivity
    expect(screen.getByText('Team Burndown')).toBeInTheDocument();
    
    // Switch to collaboration
    fireEvent.click(screen.getByText('Collaboration'));
    
    await waitFor(() => {
      expect(screen.getByText('Member Activity Comparison')).toBeInTheDocument();
    });
    
    // Switch to trends
    fireEvent.click(screen.getByText('Trends'));
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Progress')).toBeInTheDocument();
    });
  });

  test('changes time range filter', async () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    const timeRangeSelect = screen.getByDisplayValue('Last 30 days');
    fireEvent.change(timeRangeSelect, { target: { value: '7d' } });
    
    await waitFor(() => {
      expect(mockTeamContext.fetchTeamStats).toHaveBeenCalledWith('team1', { timeRange: '7d' });
    });
  });

  test('displays productivity metrics', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    // Should be on productivity tab by default
    expect(screen.getByText('Team Burndown')).toBeInTheDocument();
    expect(screen.getByText('Member Productivity')).toBeInTheDocument();
    expect(screen.getByText('Tasks per Member')).toBeInTheDocument();
    expect(screen.getByText('Velocity Trend')).toBeInTheDocument();
    expect(screen.getByText('Avg Task Time')).toBeInTheDocument();
  });

  test('displays collaboration metrics', async () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    fireEvent.click(screen.getByText('Collaboration'));
    
    await waitFor(() => {
      expect(screen.getByText('Comments per Task')).toBeInTheDocument();
      expect(screen.getByText('Collaboration Score')).toBeInTheDocument();
      expect(screen.getByText('Active Discussions')).toBeInTheDocument();
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
    });
  });

  test('displays trend metrics', async () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    fireEvent.click(screen.getByText('Trends'));
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Progress')).toBeInTheDocument();
      expect(screen.getByText('Priority Distribution')).toBeInTheDocument();
      expect(screen.getByText('Task Status Distribution')).toBeInTheDocument();
    });
  });

  test('calculates metrics correctly', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    // Completion rate: 30/50 = 60%
    expect(screen.getByText('60%')).toBeInTheDocument();
    
    // Tasks per member: 50/2 = 25
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  test('shows loading state', () => {
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

  test('shows error state', () => {
    const errorContext = {
      ...mockTeamContext,
      errors: { currentTeam: 'Failed to load team analytics' }
    };
    
    render(
      <BrowserRouter>
        <TeamProvider value={errorContext}>
          <ProjectProvider value={mockProjectContext}>
            <TeamAnalytics teamId="team1" />
          </ProjectProvider>
        </TeamProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Failed to load team analytics')).toBeInTheDocument();
  });

  test('fetches data on mount', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    expect(mockTeamContext.fetchTeam).toHaveBeenCalledWith('team1');
    expect(mockTeamContext.fetchTeamStats).toHaveBeenCalledWith('team1', { timeRange: '30d' });
    expect(mockTeamContext.fetchTeamActivity).toHaveBeenCalledWith('team1', { timeRange: '30d' });
    expect(mockProjectContext.fetchProjects).toHaveBeenCalledWith({ teamId: 'team1' });
  });

  test('handles empty data gracefully', () => {
    const emptyDataContext = {
      ...mockTeamContext,
      currentTeam: { ...mockTeamContext.currentTeam, members: [] },
      teamStats: {
        totalTasks: 0,
        completedTasks: 0,
        tasksByStatus: {},
        tasksByPriority: {},
        memberStats: {}
      }
    };
    
    render(
      <BrowserRouter>
        <TeamProvider value={emptyDataContext}>
          <ProjectProvider value={mockProjectContext}>
            <TeamAnalytics teamId="team1" />
          </ProjectProvider>
        </TeamProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 for empty stats
  });

  test('generates chart data correctly', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    // Charts should be rendered (we can't easily test chart content, but we can verify they exist)
    expect(screen.getByText('Team Burndown')).toBeInTheDocument();
    expect(screen.getByText('Member Productivity')).toBeInTheDocument();
  });

  test('handles trend indicators correctly', () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    // Positive trend should show up arrow
    expect(screen.getByText('+15%')).toBeInTheDocument(); // Completion trend
    expect(screen.getByText('+8%')).toBeInTheDocument(); // Velocity trend
  });

  test('displays member activity data', async () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    fireEvent.click(screen.getByText('Collaboration'));
    
    await waitFor(() => {
      expect(screen.getByText('Member Activity Comparison')).toBeInTheDocument();
    });
  });

  test('handles time range changes correctly', async () => {
    renderWithProviders(<TeamAnalytics teamId="team1" />);
    
    // Change to 7 days
    const select = screen.getByDisplayValue('Last 30 days');
    fireEvent.change(select, { target: { value: '7d' } });
    
    await waitFor(() => {
      expect(mockTeamContext.fetchTeamStats).toHaveBeenCalledWith('team1', { timeRange: '7d' });
      expect(mockTeamContext.fetchTeamActivity).toHaveBeenCalledWith('team1', { timeRange: '7d' });
    });
    
    // Change to 90 days
    fireEvent.change(select, { target: { value: '90d' } });
    
    await waitFor(() => {
      expect(mockTeamContext.fetchTeamStats).toHaveBeenCalledWith('team1', { timeRange: '90d' });
    });
  });
});