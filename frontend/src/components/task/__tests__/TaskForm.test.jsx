import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TaskForm from '../TaskForm';
import { TeamProvider } from '../../../context/TeamContext';
import { ProjectProvider } from '../../../context/ProjectContext';
import { AuthProvider } from '../../../context/AuthContext';

const mockTeams = [
  { _id: 'team1', name: 'Development Team', members: [
    { user: { _id: 'user1', name: 'John Doe' } },
    { user: { _id: 'user2', name: 'Jane Smith' } }
  ]},
  { _id: 'team2', name: 'Design Team', members: [
    { user: { _id: 'user3', name: 'Alice Johnson' } }
  ]}
];

const mockProjects = [
  { 
    _id: 'project1', 
    name: 'Web App', 
    team: { _id: 'team1', name: 'Development Team' },
    members: [
      { user: { _id: 'user1', name: 'John Doe' } },
      { user: { _id: 'user2', name: 'Jane Smith' } }
    ]
  },
  { 
    _id: 'project2', 
    name: 'Mobile App', 
    team: { _id: 'team2', name: 'Design Team' },
    members: [
      { user: { _id: 'user3', name: 'Alice Johnson' } }
    ]
  }
];

const mockTeamContext = {
  teams: mockTeams,
  fetchTeams: jest.fn()
};

const mockProjectContext = {
  projects: mockProjects,
  fetchProjects: jest.fn()
};

const mockAuthContext = {
  user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' }
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <TeamProvider value={mockTeamContext}>
          <ProjectProvider value={mockProjectContext}>
            {component}
          </ProjectProvider>
        </TeamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('TaskForm with Team Collaboration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders basic task form fields', () => {
    renderWithProviders(
      <TaskForm onSubmit={jest.fn()} onCancel={jest.fn()} />
    );
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  });

  test('shows team collaboration section when enabled', () => {
    renderWithProviders(
      <TaskForm 
        onSubmit={jest.fn()} 
        onCancel={jest.fn()} 
        showAssignment={true}
        showProjectSelection={true}
      />
    );
    
    expect(screen.getByText('Team Collaboration')).toBeInTheDocument();
    expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/assign to/i)).toBeInTheDocument();
  });

  test('hides team collaboration section when disabled', () => {
    renderWithProviders(
      <TaskForm 
        onSubmit={jest.fn()} 
        onCancel={jest.fn()} 
        showAssignment={false}
        showProjectSelection={false}
      />
    );
    
    expect(screen.queryByText('Team Collaboration')).not.toBeInTheDocument();
  });

  test('populates team and project options', () => {
    renderWithProviders(
      <TaskForm 
        onSubmit={jest.fn()} 
        onCancel={jest.fn()} 
        showAssignment={true}
        showProjectSelection={true}
      />
    );
    
    // Check team options
    const teamSelect = screen.getByLabelText(/team/i);
    expect(teamSelect).toBeInTheDocument();
    
    // Check project options
    const projectSelect = screen.getByLabelText(/project/i);
    expect(projectSelect).toBeInTheDocument();
  });

  test('filters projects by selected team', async () => {
    renderWithProviders(
      <TaskForm 
        onSubmit={jest.fn()} 
        onCancel={jest.fn()} 
        showAssignment={true}
        showProjectSelection={true}
      />
    );
    
    const teamSelect = screen.getByLabelText(/team/i);
    fireEvent.change(teamSelect, { target: { value: 'team1' } });
    
    await waitFor(() => {
      const projectSelect = screen.getByLabelText(/project/i);
      // Should only show projects from team1
      expect(projectSelect.children).toHaveLength(2); // "No Project" + 1 project from team1
    });
  });

  test('updates available assignees based on project selection', async () => {
    renderWithProviders(
      <TaskForm 
        onSubmit={jest.fn()} 
        onCancel={jest.fn()} 
        showAssignment={true}
        showProjectSelection={true}
      />
    );
    
    const projectSelect = screen.getByLabelText(/project/i);
    fireEvent.change(projectSelect, { target: { value: 'project1' } });
    
    await waitFor(() => {
      const assigneeSelect = screen.getByLabelText(/assign to/i);
      // Should show project members + current user
      expect(assigneeSelect.children.length).toBeGreaterThan(1);
    });
  });

  test('submits form with collaboration data', async () => {
    const onSubmit = jest.fn();
    renderWithProviders(
      <TaskForm 
        onSubmit={onSubmit} 
        onCancel={jest.fn()} 
        showAssignment={true}
        showProjectSelection={true}
      />
    );
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/title/i), { 
      target: { value: 'Test Task' } 
    });
    
    // Select team, project, and assignee
    fireEvent.change(screen.getByLabelText(/team/i), { 
      target: { value: 'team1' } 
    });
    fireEvent.change(screen.getByLabelText(/project/i), { 
      target: { value: 'project1' } 
    });
    fireEvent.change(screen.getByLabelText(/assign to/i), { 
      target: { value: 'user2' } 
    });
    
    // Submit form
    fireEvent.click(screen.getByText(/create task/i));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          teamId: 'team1',
          projectId: 'project1',
          assignee: 'user2'
        })
      );
    });
  });

  test('initializes form with existing task data', () => {
    const existingTask = {
      _id: 'task1',
      title: 'Existing Task',
      description: 'Task description',
      priority: 'high',
      assignee: { _id: 'user2', name: 'Jane Smith' },
      project: { _id: 'project1', name: 'Web App' },
      team: { _id: 'team1', name: 'Development Team' }
    };
    
    renderWithProviders(
      <TaskForm 
        task={existingTask}
        onSubmit={jest.fn()} 
        onCancel={jest.fn()} 
        showAssignment={true}
        showProjectSelection={true}
      />
    );
    
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Task description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('high')).toBeInTheDocument();
  });

  test('shows assignee context when assignee is selected', async () => {
    renderWithProviders(
      <TaskForm 
        onSubmit={jest.fn()} 
        onCancel={jest.fn()} 
        showAssignment={true}
        showProjectSelection={true}
      />
    );
    
    const assigneeSelect = screen.getByLabelText(/assign to/i);
    fireEvent.change(assigneeSelect, { target: { value: 'user1' } });
    
    await waitFor(() => {
      expect(screen.getByText(/assigned to:/i)).toBeInTheDocument();
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
  });

  test('fetches teams and projects on mount', () => {
    renderWithProviders(
      <TaskForm 
        onSubmit={jest.fn()} 
        onCancel={jest.fn()} 
        showAssignment={true}
        showProjectSelection={true}
      />
    );
    
    expect(mockTeamContext.fetchTeams).toHaveBeenCalled();
    expect(mockProjectContext.fetchProjects).toHaveBeenCalled();
  });
});