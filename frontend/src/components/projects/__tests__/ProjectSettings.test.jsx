import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectSettings from '../ProjectSettings';
import { ProjectProvider } from '../../../context/ProjectContext';
import { TeamProvider } from '../../../context/TeamContext';
import { AuthProvider } from '../../../context/AuthContext';

const mockProject = {
  _id: 'project1',
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  priority: 'high',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  budget: 10000,
  members: [
    {
      user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
      role: 'admin'
    },
    {
      user: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
      role: 'member'
    }
  ]
};

const mockProjectContext = {
  currentProject: mockProject,
  loading: { currentProject: false, updateProject: false },
  errors: {},
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  archiveProject: jest.fn(),
  addProjectMember: jest.fn(),
  removeProjectMember: jest.fn(),
  updateProjectMemberRole: jest.fn(),
  canPerformAction: jest.fn(() => true),
  fetchProject: jest.fn()
};

const mockTeamContext = {
  teams: [
    { _id: 'team1', name: 'Development Team' },
    { _id: 'team2', name: 'Design Team' }
  ],
  fetchTeams: jest.fn()
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

describe('ProjectSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders project settings with project information', () => {
    renderWithProviders(<ProjectSettings projectId="project1" />);
    
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test project')).toBeInTheDocument();
  });

  test('displays project members list', () => {
    renderWithProviders(<ProjectSettings projectId="project1" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('updates project information when form is submitted', async () => {
    renderWithProviders(<ProjectSettings projectId="project1" />);
    
    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.change(nameInput, { target: { value: 'Updated Project Name' } });
    
    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProjectContext.updateProject).toHaveBeenCalledWith('project1', expect.objectContaining({
        name: 'Updated Project Name'
      }));
    });
  });

  test('shows add member modal when add member button is clicked', () => {
    renderWithProviders(<ProjectSettings projectId="project1" />);
    
    const addButton = screen.getByText(/add member/i);
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add Project Member')).toBeInTheDocument();
  });

  test('adds new member when form is submitted', async () => {
    renderWithProviders(<ProjectSettings projectId="project1" />);
    
    // Open add member modal
    const addButton = screen.getByText(/add member/i);
    fireEvent.click(addButton);
    
    // Fill form
    const emailInput = screen.getByPlaceholderText(/enter email address/i);
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /add member/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockProjectContext.addProjectMember).toHaveBeenCalledWith('project1', {
        email: 'new@example.com',
        role: 'member'
      });
    });
  });

  test('shows delete confirmation when delete button is clicked', () => {
    renderWithProviders(<ProjectSettings projectId="project1" />);
    
    const deleteButton = screen.getByText(/delete project/i);
    fireEvent.click(deleteButton);
    
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  test('shows archive confirmation when archive button is clicked', () => {
    renderWithProviders(<ProjectSettings projectId="project1" />);
    
    const archiveButton = screen.getByText(/archive/i);
    fireEvent.click(archiveButton);
    
    expect(screen.getByText(/archive project/i)).toBeInTheDocument();
  });

  test('disables form when user lacks edit permissions', () => {
    const restrictedContext = {
      ...mockProjectContext,
      canPerformAction: jest.fn((projectId, action) => action !== 'edit_project')
    };
    
    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <TeamProvider value={mockTeamContext}>
            <ProjectProvider value={restrictedContext}>
              <ProjectSettings projectId="project1" />
            </ProjectProvider>
          </TeamProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    const nameInput = screen.getByDisplayValue('Test Project');
    expect(nameInput).toBeDisabled();
  });
});