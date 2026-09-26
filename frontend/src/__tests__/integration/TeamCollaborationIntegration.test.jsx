import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { TeamProvider } from '../../context/TeamContext';
import { ProjectProvider } from '../../context/ProjectContext';
import { NotificationProvider } from '../../context/NotificationContext';
import TeamDashboard from '../../components/teams/TeamDashboard';
import ProjectDashboard from '../../components/projects/ProjectDashboard';
import TaskForm from '../../components/task/TaskForm';
import TaskComments from '../../components/task/TaskComments';
import MemberList from '../../components/members/MemberList';
import InviteModal from '../../components/members/InviteModal';

// Mock data
const mockUser = {
  _id: 'user1',
  name: 'John Doe',
  email: 'john@example.com'
};

const mockTeam = {
  _id: 'team1',
  name: 'Development Team',
  description: 'Main development team',
  members: [
    { user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' }, role: 'admin' },
    { user: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }, role: 'member' },
    { user: { _id: 'user3', name: 'Bob Wilson', email: 'bob@example.com' }, role: 'member' }
  ],
  inviteCode: 'DEV123'
};

const mockProject = {
  _id: 'project1',
  name: 'Web Application',
  description: 'Main web application project',
  team: { _id: 'team1', name: 'Development Team' },
  members: [
    { user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' }, role: 'admin' },
    { user: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }, role: 'member' }
  ],
  status: 'active'
};

const mockTasks = [
  {
    _id: 'task1',
    title: 'Implement authentication',
    description: 'Add login and registration',
    assignee: { _id: 'user2', name: 'Jane Smith' },
    project: mockProject,
    team: mockTeam,
    status: 'in-progress',
    priority: 'high',
    comments: [
      {
        _id: 'comment1',
        text: 'Working on this now',
        author: { _id: 'user2', name: 'Jane Smith' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }
];

// Create comprehensive mock contexts
const createMockAuthContext = (overrides = {}) => ({
  user: mockUser,
  isAuthenticated: true,
  userTeams: [mockTeam],
  userProjects: [mockProject],
  teamPermissions: {
    [mockTeam._id]: {
      role: 'admin',
      canManage: true,
      canInvite: true,
      canEdit: true
    }
  },
  projectPermissions: {
    [mockProject._id]: {
      role: 'admin',
      canManage: true,
      canAssign: true,
      canEdit: true
    }
  },
  hasTeamPermission: jest.fn(() => true),
  hasProjectPermission: jest.fn(() => true),
  getUserTeamRole: jest.fn(() => 'admin'),
  getUserProjectRole: jest.fn(() => 'admin'),
  updateTeamMembership: jest.fn(),
  updateProjectMembership: jest.fn(),
  refreshUserTeamsAndProjects: jest.fn(),
  loading: false,
  error: null,
  ...overrides
});

const createMockTeamContext = (overrides = {}) => ({
  teams: [mockTeam],
  currentTeam: mockTeam,
  teamStats: {
    memberCount: 3,
    projectCount: 1,
    completedTasks: 5,
    totalTasks: 10,
    recentActivity: []
  },
  loading: { teams: false, currentTeam: false, stats: false },
  errors: {},
  fetchTeams: jest.fn(),
  fetchTeam: jest.fn(),
  fetchTeamStats: jest.fn(),
  createTeam: jest.fn(),
  updateTeam: jest.fn(),
  deleteTeam: jest.fn(),
  inviteMembers: jest.fn(),
  removeMember: jest.fn(),
  updateMemberRole: jest.fn(),
  generateInviteCode: jest.fn(),
  joinTeamByInviteCode: jest.fn(),
  canPerformAction: jest.fn(() => true),
  ...overrides
});

const createMockProjectContext = (overrides = {}) => ({
  projects: [mockProject],
  currentProject: mockProject,
  projectStats: {
    taskCount: 10,
    completedTasks: 5,
    progress: 50,
    overdueTasks: 1
  },
  projectTasks: mockTasks,
  loading: { projects: false, currentProject: false, stats: false },
  errors: {},
  fetchProjects: jest.fn(),
  fetchProject: jest.fn(),
  fetchProjectStats: jest.fn(),
  fetchProjectTasks: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  addProjectMember: jest.fn(),
  removeProjectMember: jest.fn(),
  updateProjectMemberRole: jest.fn(),
  canPerformAction: jest.fn(() => true),
  ...overrides
});

const createMockNotificationContext = (overrides = {}) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  errors: {},
  fetchNotifications: jest.fn(),
  addNotification: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  ...overrides
});

const renderWithAllProviders = (component, contextOverrides = {}) => {
  const authContext = createMockAuthContext(contextOverrides.auth);
  const teamContext = createMockTeamContext(contextOverrides.team);
  const projectContext = createMockProjectContext(contextOverrides.project);
  const notificationContext = createMockNotificationContext(contextOverrides.notification);

  return render(
    <BrowserRouter>
      <AuthProvider value={authContext}>
        <NotificationProvider value={notificationContext}>
          <TeamProvider value={teamContext}>
            <ProjectProvider value={projectContext}>
              {component}
            </ProjectProvider>
          </TeamProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Team Collaboration Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Integration', () => {
    test('auth context integrates with team and project contexts', async () => {
      const authContext = createMockAuthContext();
      const teamContext = createMockTeamContext();
      const projectContext = createMockProjectContext();

      renderWithAllProviders(
        <TeamDashboard teamId="team1" />,
        { auth: authContext, team: teamContext, project: projectContext }
      );

      await waitFor(() => {
        expect(teamContext.fetchTeam).toHaveBeenCalledWith('team1');
        expect(teamContext.fetchTeamStats).toHaveBeenCalledWith('team1');
      });

      // Verify permission checks
      expect(authContext.hasTeamPermission).toHaveBeenCalled();
      expect(teamContext.canPerformAction).toHaveBeenCalled();
    });

    test('team membership updates propagate to auth context', async () => {
      const authContext = createMockAuthContext();
      const teamContext = createMockTeamContext();

      renderWithAllProviders(
        <MemberList teamId="team1" />,
        { auth: authContext, team: teamContext }
      );

      // Simulate member role update
      await waitFor(() => {
        teamContext.updateMemberRole('team1', 'user2', 'admin');
      });

      // Verify auth context is updated
      expect(authContext.updateTeamMembership).toHaveBeenCalled();
    });

    test('project membership updates propagate to auth context', async () => {
      const authContext = createMockAuthContext();
      const projectContext = createMockProjectContext();

      renderWithAllProviders(
        <ProjectDashboard projectId="project1" />,
        { auth: authContext, project: projectContext }
      );

      // Simulate member addition
      await waitFor(() => {
        projectContext.addProjectMember('project1', {
          email: 'new@example.com',
          role: 'member'
        });
      });

      // Verify auth context is updated
      expect(authContext.updateProjectMembership).toHaveBeenCalled();
    });
  });

  describe('Cross-Component Data Flow', () => {
    test('task assignment updates reflect across components', async () => {
      const projectContext = createMockProjectContext();
      
      renderWithAllProviders(
        <TaskForm
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          teamId="team1"
          projectId="project1"
          showAssignment={true}
        />,
        { project: projectContext }
      );

      // Fill task form with assignment
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'New Task' }
      });

      fireEvent.change(screen.getByLabelText(/assign to/i), {
        target: { value: 'user2' }
      });

      // Submit form
      fireEvent.click(screen.getByText(/create task/i));

      await waitFor(() => {
        expect(screen.getByText(/assigned to:/i)).toBeInTheDocument();
      });
    });

    test('team invitation flow integrates with notification system', async () => {
      const teamContext = createMockTeamContext();
      const notificationContext = createMockNotificationContext();

      renderWithAllProviders(
        <InviteModal
          isOpen={true}
          onClose={jest.fn()}
          teamId="team1"
        />,
        { team: teamContext, notification: notificationContext }
      );

      // Send invitation
      fireEvent.change(screen.getByPlaceholderText(/enter email/i), {
        target: { value: 'newmember@example.com' }
      });

      fireEvent.click(screen.getByText(/send invites/i));

      await waitFor(() => {
        expect(teamContext.inviteMembers).toHaveBeenCalledWith('team1', {
          invites: [{ email: 'newmember@example.com', role: 'member' }]
        });
      });

      // Verify notification is added
      expect(notificationContext.addNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Invitation sent successfully'
      });
    });

    test('comment mentions trigger notifications', async () => {
      const notificationContext = createMockNotificationContext();

      renderWithAllProviders(
        <TaskComments
          taskId="task1"
          comments={mockTasks[0].comments}
          onAddComment={jest.fn()}
          onUpdateComment={jest.fn()}
          onDeleteComment={jest.fn()}
          teamId="team1"
        />,
        { notification: notificationContext }
      );

      // Add comment with mention
      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(commentInput, {
        target: { value: 'Hey @Jane, can you review this?' }
      });

      fireEvent.click(screen.getByText('Comment'));

      await waitFor(() => {
        expect(notificationContext.addNotification).toHaveBeenCalledWith({
          type: 'mention',
          message: 'You were mentioned in a comment',
          userId: 'user2'
        });
      });
    });
  });

  describe('Permission System Integration', () => {
    test('role-based UI rendering works across components', async () => {
      const authContext = createMockAuthContext({
        teamPermissions: {
          [mockTeam._id]: {
            role: 'member',
            canManage: false,
            canInvite: false,
            canEdit: false
          }
        }
      });

      renderWithAllProviders(
        <TeamDashboard teamId="team1" />,
        { auth: authContext }
      );

      await waitFor(() => {
        // Admin-only buttons should not be visible
        expect(screen.queryByText('Team Settings')).not.toBeInTheDocument();
        expect(screen.queryByText('Invite Members')).not.toBeInTheDocument();
      });
    });

    test('permission changes update UI dynamically', async () => {
      const authContext = createMockAuthContext();
      const { rerender } = renderWithAllProviders(
        <TeamDashboard teamId="team1" />,
        { auth: authContext }
      );

      // Initially has admin permissions
      await waitFor(() => {
        expect(screen.getByText('Team Settings')).toBeInTheDocument();
      });

      // Update permissions to member
      const updatedAuthContext = createMockAuthContext({
        teamPermissions: {
          [mockTeam._id]: {
            role: 'member',
            canManage: false,
            canInvite: false,
            canEdit: false
          }
        }
      });

      rerender(
        <BrowserRouter>
          <AuthProvider value={updatedAuthContext}>
            <TeamProvider value={createMockTeamContext()}>
              <ProjectProvider value={createMockProjectContext()}>
                <TeamDashboard teamId="team1" />
              </ProjectProvider>
            </TeamProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Team Settings')).not.toBeInTheDocument();
      });
    });

    test('cross-context permission validation', async () => {
      const authContext = createMockAuthContext();
      const teamContext = createMockTeamContext({
        canPerformAction: jest.fn((teamId, action) => {
          // Cross-validate with auth context
          return authContext.hasTeamPermission(teamId, action);
        })
      });

      renderWithAllProviders(
        <MemberList teamId="team1" />,
        { auth: authContext, team: teamContext }
      );

      await waitFor(() => {
        expect(teamContext.canPerformAction).toHaveBeenCalled();
        expect(authContext.hasTeamPermission).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('error propagation across contexts', async () => {
      const teamContext = createMockTeamContext({
        errors: { currentTeam: 'Failed to load team' }
      });

      renderWithAllProviders(
        <TeamDashboard teamId="team1" />,
        { team: teamContext }
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load team')).toBeInTheDocument();
      });
    });

    test('network error recovery flow', async () => {
      const authContext = createMockAuthContext({
        error: 'Network error'
      });
      const teamContext = createMockTeamContext();

      renderWithAllProviders(
        <TeamDashboard teamId="team1" />,
        { auth: authContext, team: teamContext }
      );

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(authContext.refreshUserTeamsAndProjects).toHaveBeenCalled();
        expect(teamContext.fetchTeam).toHaveBeenCalled();
      });
    });

    test('authentication error handling', async () => {
      const authContext = createMockAuthContext({
        isAuthenticated: false,
        error: 'Authentication required'
      });

      renderWithAllProviders(
        <TeamDashboard teamId="team1" />,
        { auth: authContext }
      );

      await waitFor(() => {
        expect(screen.getByText('Authentication required')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates Integration', () => {
    test('team member updates reflect in real-time', async () => {
      const teamContext = createMockTeamContext();
      const { rerender } = renderWithAllProviders(
        <MemberList teamId="team1" />,
        { team: teamContext }
      );

      // Initial member count
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Simulate new member added
      const updatedTeam = {
        ...mockTeam,
        members: [
          ...mockTeam.members,
          { user: { _id: 'user4', name: 'Alice Brown', email: 'alice@example.com' }, role: 'member' }
        ]
      };

      const updatedTeamContext = createMockTeamContext({
        currentTeam: updatedTeam
      });

      rerender(
        <BrowserRouter>
          <AuthProvider value={createMockAuthContext()}>
            <TeamProvider value={updatedTeamContext}>
              <ProjectProvider value={createMockProjectContext()}>
                <MemberList teamId="team1" />
              </ProjectProvider>
            </TeamProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      });
    });

    test('task status updates propagate to project dashboard', async () => {
      const projectContext = createMockProjectContext();
      const { rerender } = renderWithAllProviders(
        <ProjectDashboard projectId="project1" />,
        { project: projectContext }
      );

      // Initial stats
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument(); // Progress
      });

      // Simulate task completion
      const updatedProjectContext = createMockProjectContext({
        projectStats: {
          taskCount: 10,
          completedTasks: 7,
          progress: 70,
          overdueTasks: 0
        }
      });

      rerender(
        <BrowserRouter>
          <AuthProvider value={createMockAuthContext()}>
            <ProjectProvider value={updatedProjectContext}>
              <ProjectDashboard projectId="project1" />
            </ProjectProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('70%')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    test('lazy loading and memoization work correctly', async () => {
      const teamContext = createMockTeamContext();
      const projectContext = createMockProjectContext();

      // Render with large datasets
      const largeTeam = {
        ...mockTeam,
        members: Array.from({ length: 100 }, (_, i) => ({
          user: { _id: `user${i}`, name: `User ${i}`, email: `user${i}@example.com` },
          role: 'member'
        }))
      };

      renderWithAllProviders(
        <MemberList teamId="team1" />,
        { 
          team: { ...teamContext, currentTeam: largeTeam },
          project: projectContext 
        }
      );

      await waitFor(() => {
        // Should not render all 100 members at once
        const memberElements = screen.getAllByText(/User \d+/);
        expect(memberElements.length).toBeLessThan(100);
      });
    });

    test('context updates do not cause unnecessary re-renders', async () => {
      const renderSpy = jest.fn();
      const MemoizedComponent = React.memo(() => {
        renderSpy();
        return <div>Memoized Component</div>;
      });

      const authContext = createMockAuthContext();
      const { rerender } = renderWithAllProviders(
        <MemoizedComponent />,
        { auth: authContext }
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Update unrelated auth context property
      const updatedAuthContext = {
        ...authContext,
        someUnrelatedProperty: 'new value'
      };

      rerender(
        <BrowserRouter>
          <AuthProvider value={updatedAuthContext}>
            <TeamProvider value={createMockTeamContext()}>
              <ProjectProvider value={createMockProjectContext()}>
                <MemoizedComponent />
              </ProjectProvider>
            </TeamProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      // Should not re-render if memoization is working
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Consistency Integration', () => {
    test('data consistency across multiple components', async () => {
      const teamContext = createMockTeamContext();
      const projectContext = createMockProjectContext();

      renderWithAllProviders(
        <div>
          <TeamDashboard teamId="team1" />
          <ProjectDashboard projectId="project1" />
        </div>,
        { team: teamContext, project: projectContext }
      );

      await waitFor(() => {
        // Both components should show consistent team information
        const teamNames = screen.getAllByText('Development Team');
        expect(teamNames.length).toBeGreaterThan(0);
      });

      // Verify both components fetch their data
      expect(teamContext.fetchTeam).toHaveBeenCalledWith('team1');
      expect(projectContext.fetchProject).toHaveBeenCalledWith('project1');
    });

    test('optimistic updates and rollback on failure', async () => {
      const teamContext = createMockTeamContext({
        updateMemberRole: jest.fn().mockRejectedValue(new Error('Update failed'))
      });

      renderWithAllProviders(
        <MemberList teamId="team1" />,
        { team: teamContext }
      );

      // Attempt to update member role
      const roleSelect = screen.getByDisplayValue('member');
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(teamContext.updateMemberRole).toHaveBeenCalled();
      });

      // Should show error and rollback
      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
        expect(roleSelect.value).toBe('member'); // Rolled back
      });
    });
  });
});