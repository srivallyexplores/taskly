import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { AuthProvider } from '../../context/AuthContext';
import { TeamProvider } from '../../context/TeamContext';
import { ProjectProvider } from '../../context/ProjectContext';
import { NotificationProvider } from '../../context/NotificationContext';

// Mock API responses
const mockApiResponses = {
  teams: [
    {
      _id: 'team1',
      name: 'Development Team',
      description: 'Main development team',
      members: [
        { user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' }, role: 'admin' },
        { user: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }, role: 'member' }
      ],
      inviteCode: 'DEV123'
    }
  ],
  projects: [
    {
      _id: 'project1',
      name: 'Web Application',
      description: 'Main web application project',
      team: { _id: 'team1', name: 'Development Team' },
      members: [
        { user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' }, role: 'admin' }
      ],
      status: 'active'
    }
  ],
  tasks: [
    {
      _id: 'task1',
      title: 'Implement user authentication',
      description: 'Add login and registration functionality',
      assignee: { _id: 'user1', name: 'John Doe' },
      project: { _id: 'project1', name: 'Web Application' },
      status: 'in-progress',
      priority: 'high',
      due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  ]
};

// Mock contexts
const createMockAuthContext = (user = null) => ({
  user: user || { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
  isAuthenticated: !!user,
  userTeams: mockApiResponses.teams,
  userProjects: mockApiResponses.projects,
  hasTeamPermission: jest.fn(() => true),
  hasProjectPermission: jest.fn(() => true),
  getUserTeamRole: jest.fn(() => 'admin'),
  getUserProjectRole: jest.fn(() => 'admin'),
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshUserTeamsAndProjects: jest.fn()
});

const createMockTeamContext = () => ({
  teams: mockApiResponses.teams,
  currentTeam: mockApiResponses.teams[0],
  teamStats: {
    memberCount: 2,
    projectCount: 1,
    completedTasks: 5,
    totalTasks: 10
  },
  loading: { teams: false, currentTeam: false },
  errors: {},
  fetchTeams: jest.fn(),
  fetchTeam: jest.fn(),
  createTeam: jest.fn(),
  updateTeam: jest.fn(),
  inviteMembers: jest.fn(),
  removeMember: jest.fn(),
  updateMemberRole: jest.fn(),
  generateInviteCode: jest.fn(),
  joinTeamByInviteCode: jest.fn(),
  canPerformAction: jest.fn(() => true)
});

const createMockProjectContext = () => ({
  projects: mockApiResponses.projects,
  currentProject: mockApiResponses.projects[0],
  projectStats: {
    taskCount: 10,
    completedTasks: 5,
    progress: 50
  },
  loading: { projects: false, currentProject: false },
  errors: {},
  fetchProjects: jest.fn(),
  fetchProject: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  addProjectMember: jest.fn(),
  removeProjectMember: jest.fn(),
  updateProjectMemberRole: jest.fn(),
  canPerformAction: jest.fn(() => true)
});

const createMockNotificationContext = () => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  addNotification: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn()
});

const renderApp = (authContext = createMockAuthContext()) => {
  const teamContext = createMockTeamContext();
  const projectContext = createMockProjectContext();
  const notificationContext = createMockNotificationContext();

  return render(
    <BrowserRouter>
      <AuthProvider value={authContext}>
        <NotificationProvider value={notificationContext}>
          <TeamProvider value={teamContext}>
            <ProjectProvider value={projectContext}>
              <App />
            </ProjectProvider>
          </TeamProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Team Collaboration E2E Workflows', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Team Creation and Management Workflow', () => {
    test('complete team creation and member invitation flow', async () => {
      const authContext = createMockAuthContext();
      const teamContext = createMockTeamContext();
      
      renderApp(authContext);

      // Navigate to teams page
      await user.click(screen.getByText('Teams'));
      
      await waitFor(() => {
        expect(screen.getByText('Development Team')).toBeInTheDocument();
      });

      // Create new team
      await user.click(screen.getByText('Create Team'));
      
      await waitFor(() => {
        expect(screen.getByText('Create New Team')).toBeInTheDocument();
      });

      // Fill team form
      await user.type(screen.getByLabelText(/team name/i), 'Design Team');
      await user.type(screen.getByLabelText(/description/i), 'UI/UX Design Team');
      
      // Submit team creation
      await user.click(screen.getByText('Create Team'));
      
      await waitFor(() => {
        expect(teamContext.createTeam).toHaveBeenCalledWith({
          name: 'Design Team',
          description: 'UI/UX Design Team'
        });
      });

      // Invite members to team
      await user.click(screen.getByText('Invite Members'));
      
      await waitFor(() => {
        expect(screen.getByText('Invite Team Members')).toBeInTheDocument();
      });

      // Add email invitation
      await user.type(screen.getByPlaceholderText(/enter email/i), 'designer@example.com');
      await user.click(screen.getByText('Send Invites'));
      
      await waitFor(() => {
        expect(teamContext.inviteMembers).toHaveBeenCalledWith('team1', {
          invites: [{ email: 'designer@example.com', role: 'member' }]
        });
      });
    });

    test('team settings and member management workflow', async () => {
      const teamContext = createMockTeamContext();
      renderApp();

      // Navigate to team settings
      await user.click(screen.getByText('Teams'));
      await user.click(screen.getByText('Development Team'));
      await user.click(screen.getByText('Settings'));
      
      await waitFor(() => {
        expect(screen.getByText('Team Settings')).toBeInTheDocument();
      });

      // Update team information
      const nameInput = screen.getByDisplayValue('Development Team');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Development Team');
      
      await user.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(teamContext.updateTeam).toHaveBeenCalledWith('team1', {
          name: 'Updated Development Team',
          description: 'Main development team'
        });
      });

      // Change member role
      const roleSelects = screen.getAllByRole('combobox');
      const memberRoleSelect = roleSelects.find(select => 
        select.closest('.member-item')?.textContent.includes('Jane Smith')
      );
      
      if (memberRoleSelect) {
        await user.selectOptions(memberRoleSelect, 'admin');
        
        await waitFor(() => {
          expect(teamContext.updateMemberRole).toHaveBeenCalledWith('team1', 'user2', 'admin');
        });
      }

      // Remove member
      const removeButtons = screen.getAllByText(/remove/i);
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0]);
        
        // Confirm removal
        await user.click(screen.getByText(/confirm/i));
        
        await waitFor(() => {
          expect(teamContext.removeMember).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Project Creation and Task Assignment Workflow', () => {
    test('complete project creation and task management flow', async () => {
      const projectContext = createMockProjectContext();
      renderApp();

      // Navigate to projects
      await user.click(screen.getByText('Projects'));
      
      await waitFor(() => {
        expect(screen.getByText('Web Application')).toBeInTheDocument();
      });

      // Create new project
      await user.click(screen.getByText('New Project'));
      
      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
      });

      // Fill project form
      await user.type(screen.getByLabelText(/project name/i), 'Mobile App');
      await user.type(screen.getByLabelText(/description/i), 'Mobile application project');
      await user.selectOptions(screen.getByLabelText(/team/i), 'team1');
      
      // Submit project creation
      await user.click(screen.getByText('Create Project'));
      
      await waitFor(() => {
        expect(projectContext.createProject).toHaveBeenCalledWith({
          name: 'Mobile App',
          description: 'Mobile application project',
          teamId: 'team1'
        });
      });

      // Navigate to project dashboard
      await user.click(screen.getByText('Mobile App'));
      
      await waitFor(() => {
        expect(screen.getByText('Project Dashboard')).toBeInTheDocument();
      });

      // Create new task
      await user.click(screen.getByText('New Task'));
      
      await waitFor(() => {
        expect(screen.getByText('Create New Task')).toBeInTheDocument();
      });

      // Fill task form with assignment
      await user.type(screen.getByLabelText(/title/i), 'Design mobile UI');
      await user.type(screen.getByLabelText(/description/i), 'Create mobile app UI designs');
      await user.selectOptions(screen.getByLabelText(/assign to/i), 'user2');
      await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
      
      // Submit task creation
      await user.click(screen.getByText('Create Task'));
      
      await waitFor(() => {
        expect(screen.getByText('Task created successfully')).toBeInTheDocument();
      });
    });

    test('task collaboration and commenting workflow', async () => {
      renderApp();

      // Navigate to task
      await user.click(screen.getByText('Tasks'));
      await user.click(screen.getByText('Implement user authentication'));
      
      await waitFor(() => {
        expect(screen.getByText('Task Details')).toBeInTheDocument();
      });

      // Add comment with mention
      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      await user.type(commentInput, 'Hey @Jane, can you review this implementation?');
      
      await user.click(screen.getByText('Comment'));
      
      await waitFor(() => {
        expect(screen.getByText('Comment added successfully')).toBeInTheDocument();
      });

      // Reassign task
      await user.click(screen.getByText('Assign'));
      
      await waitFor(() => {
        expect(screen.getByText('Assign Task')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Jane Smith'));
      await user.click(screen.getByText('Assign'));
      
      await waitFor(() => {
        expect(screen.getByText('Task assigned successfully')).toBeInTheDocument();
      });

      // Update task status
      await user.click(screen.getByText('Mark Complete'));
      
      await waitFor(() => {
        expect(screen.getByText('Task completed')).toBeInTheDocument();
      });
    });
  });

  describe('Team Invitation and Joining Workflow', () => {
    test('complete invitation sharing and joining flow', async () => {
      const teamContext = createMockTeamContext();
      renderApp();

      // Generate and share invite link
      await user.click(screen.getByText('Teams'));
      await user.click(screen.getByText('Development Team'));
      await user.click(screen.getByText('Invite Members'));
      
      await waitFor(() => {
        expect(screen.getByText('Invite Team Members')).toBeInTheDocument();
      });

      // Switch to invite link method
      await user.click(screen.getByText('Invite Link'));
      
      await waitFor(() => {
        expect(screen.getByText('Generate Invite Link')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Generate Invite Link'));
      
      await waitFor(() => {
        expect(teamContext.generateInviteCode).toHaveBeenCalledWith('team1');
      });

      // Copy invite link
      await user.click(screen.getByText('Copy Link'));
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // Simulate joining team via invite code
      const joinContext = createMockAuthContext(null); // Not authenticated
      
      render(
        <BrowserRouter initialEntries={['/join/DEV123']}>
          <AuthProvider value={joinContext}>
            <TeamProvider value={teamContext}>
              <App />
            </TeamProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Join Development Team')).toBeInTheDocument();
      });

      // Sign in to join
      await user.click(screen.getByText('Sign In to Join'));
      
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });
    });
  });

  describe('Team Analytics and Reporting Workflow', () => {
    test('team analytics dashboard interaction flow', async () => {
      renderApp();

      // Navigate to team analytics
      await user.click(screen.getByText('Teams'));
      await user.click(screen.getByText('Development Team'));
      await user.click(screen.getByText('Analytics'));
      
      await waitFor(() => {
        expect(screen.getByText('Team Analytics')).toBeInTheDocument();
      });

      // Switch between metric views
      await user.click(screen.getByText('Productivity'));
      
      await waitFor(() => {
        expect(screen.getByText('Team Burndown')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Collaboration'));
      
      await waitFor(() => {
        expect(screen.getByText('Member Activity Comparison')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Trends'));
      
      await waitFor(() => {
        expect(screen.getByText('Weekly Progress')).toBeInTheDocument();
      });

      // Change time range
      await user.selectOptions(screen.getByDisplayValue('Last 30 days'), 'Last 7 days');
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Last 7 days')).toBeInTheDocument();
      });
    });
  });

  describe('Notification and Activity Workflow', () => {
    test('notification center and team activity flow', async () => {
      const notificationContext = createMockNotificationContext();
      notificationContext.notifications = [
        {
          _id: 'notif1',
          type: 'task_assigned',
          message: 'You were assigned to "Implement user authentication"',
          read: false,
          createdAt: new Date()
        },
        {
          _id: 'notif2',
          type: 'mention',
          message: 'John Doe mentioned you in a comment',
          read: false,
          createdAt: new Date()
        }
      ];
      notificationContext.unreadCount = 2;

      render(
        <BrowserRouter>
          <AuthProvider value={createMockAuthContext()}>
            <NotificationProvider value={notificationContext}>
              <TeamProvider value={createMockTeamContext()}>
                <ProjectProvider value={createMockProjectContext()}>
                  <App />
                </ProjectProvider>
              </TeamProvider>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      // Check notification bell shows unread count
      expect(screen.getByText('2')).toBeInTheDocument();

      // Open notification center
      await user.click(screen.getByLabelText('Notifications'));
      
      await waitFor(() => {
        expect(screen.getByText('You were assigned to "Implement user authentication"')).toBeInTheDocument();
        expect(screen.getByText('John Doe mentioned you in a comment')).toBeInTheDocument();
      });

      // Mark all as read
      await user.click(screen.getByText('Mark all read'));
      
      await waitFor(() => {
        expect(notificationContext.markAllAsRead).toHaveBeenCalled();
      });

      // Filter notifications
      await user.click(screen.getByText('Mentions'));
      
      await waitFor(() => {
        expect(screen.getByText('John Doe mentioned you in a comment')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Team Collaboration Workflow', () => {
    test('mobile team actions and responsive behavior', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderApp();

      // Navigate to team on mobile
      await user.click(screen.getByText('Teams'));
      await user.click(screen.getByText('Development Team'));
      
      await waitFor(() => {
        expect(screen.getByText('Development Team')).toBeInTheDocument();
      });

      // Open mobile action menu
      const fabButton = screen.getByRole('button', { name: /team actions/i });
      if (fabButton) {
        await user.click(fabButton);
        
        await waitFor(() => {
          expect(screen.getByText('New Project')).toBeInTheDocument();
          expect(screen.getByText('Invite Members')).toBeInTheDocument();
        });

        // Use mobile invite share
        await user.click(screen.getByText('Share Team'));
        
        await waitFor(() => {
          expect(screen.getByText('QR Code')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling and Recovery Workflow', () => {
    test('handles network errors and provides recovery options', async () => {
      const authContext = createMockAuthContext();
      authContext.error = 'Network error occurred';
      
      renderApp(authContext);

      await waitFor(() => {
        expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByText('Retry');
      if (retryButton) {
        await user.click(retryButton);
        
        await waitFor(() => {
          expect(authContext.refreshUserTeamsAndProjects).toHaveBeenCalled();
        });
      }
    });

    test('handles permission errors gracefully', async () => {
      const teamContext = createMockTeamContext();
      teamContext.canPerformAction = jest.fn(() => false);
      
      render(
        <BrowserRouter>
          <AuthProvider value={createMockAuthContext()}>
            <TeamProvider value={teamContext}>
              <ProjectProvider value={createMockProjectContext()}>
                <App />
              </ProjectProvider>
            </TeamProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await user.click(screen.getByText('Teams'));
      await user.click(screen.getByText('Development Team'));
      
      // Try to access settings without permission
      const settingsButton = screen.queryByText('Settings');
      if (settingsButton) {
        await user.click(settingsButton);
        
        await waitFor(() => {
          expect(screen.getByText(/permission/i)).toBeInTheDocument();
        });
      }
    });
  });
});