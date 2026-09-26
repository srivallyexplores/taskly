import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamNotifications from '../../components/notifications/TeamNotifications';

// Mock the context provider
const NotificationProvider = ({ children, value }) => (
  <div data-testid="notification-provider">{children}</div>
);

const mockNotifications = [
  {
    _id: 'notif1',
    type: 'task_assigned',
    message: 'You were assigned to "Implement user authentication"',
    read: false,
    createdAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    _id: 'notif2',
    type: 'mention',
    message: 'Jane Smith mentioned you in "Design mobile UI"',
    read: false,
    createdAt: new Date('2024-01-15T11:00:00Z')
  }
];

const mockNotificationContext = {
  notifications: mockNotifications,
  unreadCount: 2,
  loading: false,
  errors: {},
  fetchNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn()
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <NotificationProvider value={mockNotificationContext}>
        {component}
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders notification bell with unread count', () => {
    renderWithProviders(<TeamNotifications teamId="team1" />);
    
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('opens notification dropdown when bell is clicked', async () => {
    renderWithProviders(<TeamNotifications teamId="team1" />);
    
    fireEvent.click(screen.getByLabelText('Notifications'));
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  test('displays notifications correctly', async () => {
    renderWithProviders(<TeamNotifications teamId="team1" />);
    
    fireEvent.click(screen.getByLabelText('Notifications'));
    
    await waitFor(() => {
      expect(screen.getByText('You were assigned to "Implement user authentication"')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith mentioned you in "Design mobile UI"')).toBeInTheDocument();
    });
  });

  test('marks notification as read when clicked', async () => {
    renderWithProviders(<TeamNotifications teamId="team1" />);
    
    fireEvent.click(screen.getByLabelText('Notifications'));
    
    await waitFor(() => {
      const notification = screen.getByText('You were assigned to "Implement user authentication"');
      fireEvent.click(notification);
    });
    
    expect(mockNotificationContext.markAsRead).toHaveBeenCalledWith('notif1');
  });
});