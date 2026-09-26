import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectDashboard from '../ProjectDashboard';
import { ProjectProvider } from '../../../context/ProjectContext';
import { AuthProvider } from '../../../context/AuthContext';

const mockProject = {
  _id: 'project1',
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  priority: 'high',
  progress: 65,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  members: [
    {
      user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
      role: 'admin'
    }
  ]
};

const mockProjectContext = {
  currentProject: mockProject,
  projectStats: {
    taskCount: 20,
    completedTasks: 13,
    tasksByStatus: {
      'completed': 13,
      'in-progress': 5,
      'pending': 2
    },
    tasksByPriority: {
      'high': 8,
      'medium': 7,
      'low': 5
    },
    overdueTasks: 2,
    progress: 65,
    daysRemaining: 45
  },
  projectTasks: [],
  projectActivity: [],
  milestones: [],
  loading: { currentProject: false, stats: false },
  errors: {},
  fetchProject: jest.fn(),
  fetchProjectStats: jest.fn(),
  fetchProjectTasks: jest.fn(),
  fetchProjectActivity: jest.fn(),
  canPerformAction: jest.fn(() => true)
};

const mockAuthContext = {
  user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' }
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <ProjectProvider value={mockProjectContext}>
          {component}
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProjectDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders project dashboard with project information', () => {
    renderWithProviders(<ProjectDashboard projectId="project1" />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project')).toBeInTheDocument();
  });

  test('displays project statistics correctly', () => {
    renderWithProviders(<ProjectDashboard projectId="project1" />);
    
    expect(screen.getByText('20')).toBeInTheDocument(); // total tasks
    expect(screen.getByText('5')).toBeInTheDocument(); // in progress tasks
    expect(screen.getByText('2')).toBeInTheDocument(); // overdue tasks
  });

  test('shows project progress bar', () => {
    renderWithProviders(<ProjectDashboard projectId="project1" />);
    
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  test('displays project status and priority badges', () => {
    renderWithProviders(<ProjectDashboard projectId="project1" />);
    
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  test('calls fetch functions on mount', () => {
    renderWithProviders(<ProjectDashboard projectId="project1" />);
    
    expect(mockProjectContext.fetchProject).toHaveBeenCalledWith('project1');
    expect(mockProjectContext.fetchProjectStats).toHaveBeenCalledWith('project1');
    expect(mockProjectContext.fetchProjectTasks).toHaveBeenCalledWith('project1');
    expect(mockProjectContext.fetchProjectActivity).toHaveBeenCalledWith('project1', { limit: 10 });
  });

  test('shows loading state when data is loading', () => {
    const loadingContext = {
      ...mockProjectContext,
      loading: { currentProject: true, stats: true }
    };
    
    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <ProjectProvider value={loadingContext}>
            <ProjectDashboard projectId="project1" />
          </ProjectProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('displays error message when there is an error', () => {
    const errorContext = {
      ...mockProjectContext,
      errors: { currentProject: 'Failed to load project' }
    };
    
    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <ProjectProvider value={errorContext}>
            <ProjectDashboard projectId="project1" />
          </ProjectProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Failed to load project')).toBeInTheDocument();
  });
});