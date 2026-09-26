import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamDashboard from '../TeamDashboard';
import { TeamProvider } from '../../../context/TeamContext';
import { AuthProvider } from '../../../context/AuthContext';

// Mock the contexts
const mockTeamContext = {
  currentTeam: {
    _id: 'team1',
    name: 'Test Team',
    description: 'A test team',
    members: [
      {
        user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
        role: 'admin',
        joinedAt: new Date()
      }
    ],
    projects: ['project1', 'project2'],
    createdAt: new Date()
  },
  teamStats: {
    memberCount: 5,
    projectCount: 3,
    completedTasks: 25,
    totalTasks: 40,
    recentActivity: []
  },
  loading: { currentTeam: false, stats: false },
  errors: {},
  fetchTeam: jest.fn(),
  fetchTeamStats: jest.fn()
};

const mockAuthContext = {
  user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
  isAuthenticated: true
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <TeamProvider value={mockTeamContext}>
          {component}
        </TeamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('TeamDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders team dashboard with team information', () => {
    renderWithProviders(<TeamDashboard teamId="team1" />);
    
    expect(screen.getByText('Test Team')).toBeInTheDocument();
    expect(screen.getByText('A test team')).toBeInTheDocument();
  });

  test('displays team statistics correctly', () => {
    renderWithProviders(<TeamDashboard teamId="team1" />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // member count
    expect(screen.getByText('3')).toBeInTheDocument(); // project count
    expect(screen.getByText('25')).toBeInTheDocument(); // completed tasks
  });

  test('shows loading state when data is loading', () => {
    const loadingContext = {
      ...mockTeamContext,
      loading: { currentTeam: true, stats: true }
    };
    
    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <TeamProvider value={loadingContext}>
            <TeamDashboard teamId="team1" />
          </TeamProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('displays error message when there is an error', () => {
    const errorContext = {
      ...mockTeamContext,
      errors: { currentTeam: 'Failed to load team' }
    };
    
    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <TeamProvider value={errorContext}>
            <TeamDashboard teamId="team1" />
          </TeamProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Failed to load team')).toBeInTheDocument();
  });

  test('calls fetchTeam and fetchTeamStats on mount', () => {
    renderWithProviders(<TeamDashboard teamId="team1" />);
    
    expect(mockTeamContext.fetchTeam).toHaveBeenCalledWith('team1');
    expect(mockTeamContext.fetchTeamStats).toHaveBeenCalledWith('team1');
  });
});