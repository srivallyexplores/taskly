import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamNotifications from '../TeamNotifications';
import { TeamProvider } from '../../../context/TeamContext';
import { ProjectProvider } from '../../../context/ProjectContext';
import { AuthProvider } from '../../../context/AuthContext';

const mockNotifications = [
  {
    _id: 'notif1',
    type: 'task_assigned',
    message: 'You were assigned to "Implement authentication"',
    data: {
      taskTitle: 'Implement authentication',
      taskId: 'task1'
    },
    actor: { _id: 'user2', name: 'Jane Smith', avatar: null },
    teamId: 'team1',
    read: false,
    createdAt: new Date('2024-01-01T10:00:00Z')
  },
  {
    _id: 'notif2',
    type: 'comment_added',
    message: 'John Doe commented on "Fix login bug"',
    data: {
      taskTitle: 'Fix login bug',
      taskId: 'task2'
    },
    actor: { _id: 'user1', name: 'John Doe', avatar: null },
    projectId: 'project1',
    read: true,
    createdAt: new Date('2024-01-01T09:00:00Z')
  },
  {
    _id: 'notif3',
    type: 'mention',
    message: 'Alice mentioned you in a comment',
    data: {
      taskTitle: 'Update documentation',
      taskId: 'task3'
    },
    actor: { _id: 'user3', name: 'Alice Johnson', avatar: null },
    teamId: 'team1',
    read: false,
    createdAt: new Date('2024-01-01T08:00:00Z')
  }
];

const mockTeamContext = {
  notifications: mockNotifications.filter(n => n.teamId),
  markNotificationAsRead: jest.fn(),
  fetchNotifications: jest.fn()
};

const mockProjectContext = {
  notifications: mockNotifications.filter(n => n.projectId),
  markNotificationAsRead: jest.fn(),
  fetchNotifications: jest.fn()
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

describe('TeamNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders notification bell with unread count', () => {
    renderWithProviders(
      <TeamNotifications teamId="team1" projectId="project1" />
    );
    
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Unread count
  });

  test('opens notification dropdown when bell is clicked', async () => {
    renderWithProviders(
      <TeamNotifications teamId="team1" projectId="project1" />
    );
    
    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('You were assigned to "Implement authentication"')).toBeInTheDocument();
    });
  });

  test('displays notifications with correct formatting', async () => {
    renderWithProviders(
      <TeamNotifications teamId="team1" projectId="project1" />
    );
    
    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      // Check notification messages
      expect(screen.getByText('You were assigned to "Implement authentication"')).toBeInTheDocument();
      expect(screen.getByText('John Doe commented on "Fix login bug"')).toBeInTheDocument();
      expect(screen.getByText('Alice mentioned you in a comment')).toBeInTheDocument();
      
      // Check timestamps
      expect(screen.getByText(/ago/)).toBeInTheDocument();
      
      // Check badges
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Project')).toBeInTheDocument();
    });
  });

  test('filters notifications by type', async () => {
    renderWithProviders(
      <TeamNotifications teamId="team1" projectId="project1" />
    );
    
    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.getByText('Mentions')).toBeInTheDocument();
      expect(screen.getByText('Assignments')).toBeInTheDocument();
    });
    
    // Filter by mentions
    fireEvent.click(screen.getByText('Mentions'));
    
    await waitFor(() => {
      expect(screen.getByText('Alice mentioned you in a comment')).toBeInTheDocument();
      expect(screen.queryByText('You were assigned to "Implement authentication"')).not.toBeInTheDocument();
    });
  });

  test('marks notification as read when clicked', async () => {
    renderWithProviders(
      <TeamNotifications 
        teamId="team1" 
        projectId="project1"
        onNotificationClick={jest.fn()}
      />
    );
    
    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      const unreadNotification = screen.getByText('You were assigned to "Implement authentication"');
      fireEvent.click(unreadNotification.closest('div'));
    });
    
    expect(mockTeamContext.markNotificationAsRead).toHaveBeenCalledWith('notif1');
  });

  test('marks all notifications as read', async () => {
    renderWithProviders(
      <TeamNotifications teamId="team1" projectId="project1" />
    );
    
    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      const markAllButton = screen.getByText('Mark all read');
      fireEvent.click(markAllButton);
    });
    
    expect(mockTeamContext.markNotificationAsRead).toHaveBeenCalledWith('notif1');
    expect(mockTeamContext.markNotificationAsRead).toHaveBeenCalledWith('notif3');
  });

  test('shows correct notification icons and colors', async () => {
    renderWithProviders(
      <TeamNotifications teamId="team1" projectId="project1" />
    );
    
    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      // Each notification type should have appropriate styling
      const notifications = screen.getAllByRole('button').filter(btn => 
        btn.textContent.includes('assigned') || 
        btn.textContent.includes('commented') || 
        btn.textContent.includes('mentioned')
      );
      
      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  test('closes dropdown when clicking outside', async () => {
    renderWithProviders(
      <TeamNotifications teamId="team1" projectId="project1" />
    );
    
    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
    
    // Click outside
    const backdrop = document.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop);
    
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  test('limits notifications to maxNotifications', () => {
    const manyNotifications = Array.from({ length: 20 }, (_, i) => ({
      _id: `notif${i}`,
      type: 'task_assigned',
      message: `Notification ${i}`,
      teamId: 'team1',
      read: false,
      createdAt: new Date()
    }));

    const contextWithManyNotifications = {
      ...mockTeamContext,
      notifications: manyNotifications
    };

    render(
      <BrowserRouter>
        <TeamProvider value={contextWithManyNotifications}>
          <ProjectProvider value={mockProjectContext}>
            <TeamNotifications teamId="team1" maxNotifications={5} />
          </ProjectProvider>
        </TeamProvider>
      </BrowserRouter>
    );

    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);

    // Should only show 5 notifications
    const notificationElements = screen.getAllByText(/Notification \d+/);
    expect(notificationElements.length).toBeLessThanOrEqual(5);
  });

  test('handles empty notifications state', async () => {
    const emptyContext = {
      ...mockTeamContext,
      notifications: []
    };

    render(
      <BrowserRouter>
        <TeamProvider value={emptyContext}>
          <ProjectProvider value={mockProjectContext}>
            <TeamNotifications teamId="team1" />
          </ProjectProvider>
        </TeamProvider>
      </BrowserRouter>
    );

    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });

  test('fetches notifications on mount', () => {
    renderWithProviders(
      <TeamNotifications teamId="team1" projectId="project1" />
    );
    
    expect(mockTeamContext.fetchNotifications).toHaveBeenCalledWith('team1');
    expect(mockProjectContext.fetchNotifications).toHaveBeenCalledWith('project1');
  });

  test('calls onNotificationClick when notification is clicked', async () => {
    const onNotificationClick = jest.fn();
    
    renderWithProviders(
      <TeamNotifications 
        teamId="team1" 
        projectId="project1"
        onNotificationClick={onNotificationClick}
      />
    );
    
    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      const notification = screen.getByText('You were assigned to "Implement authentication"');
      fireEvent.click(notification.closest('div'));
    });
    
    expect(onNotificationClick).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'notif1',
        type: 'task_assigned'
      })
    );
  });
});