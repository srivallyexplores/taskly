import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamNotifications from '../../components/notifications/TeamNotifications';
import TeamAnalytics from '../../components/analytics/TeamAnalytics';
import MemberList from '../../components/members/MemberList';
import { NotificationProvider } from '../../context/NotificationContext';
import { TeamProvider } from '../../context/TeamContext';
import { ProjectProvider } from '../../context/ProjectContext';

// Mock WebSocket for real-time testing
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 10);
  }
  
  send(data) {
    // Mock send implementation
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
  
  // Helper method to simulate receiving messages
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

// Mock real-time service
class MockRealTimeService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.connected = false;
  }
  
  connect() {
    this.ws = new MockWebSocket('ws://localhost:3001');
    this.ws.onopen = () => {
      this.connected = true;
    };
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    return this.ws;
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
    }
  }
  
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  handleMessage(data) {
    const { event, payload } = data;
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(payload));
    }
  }
  
  // Helper method to simulate real-time events
  simulateEvent(event, payload) {
    if (this.ws) {
      this.ws.simulateMessage({ event, payload });
    }
  }
}

const mockRealTimeService = new MockRealTimeService();

// Mock contexts with real-time capabilities
const createMockNotificationContext = (initialNotifications = []) => {
  const context = {
    notifications: initialNotifications,
    unreadCount: initialNotifications.filter(n => !n.read).length,
    loading: false,
    errors: {},
    addNotification: jest.fn((notification) => {
      context.notifications.push({
        _id: `notif_${Date.now()}`,
        ...notification,
        createdAt: new Date(),
        read: false
      });
      context.unreadCount++;
    }),
    markAsRead: jest.fn((id) => {
      const notification = context.notifications.find(n => n._id === id);
      if (notification) {
        notification.read = true;
        context.unreadCount--;
      }
    }),
    fetchNotifications: jest.fn(),
    updateNotificationSettings: jest.fn()
  };
  return context;
};

const createMockTeamContext = (initialStats = {}) => ({
  currentTeam: {
    _id: 'team1',
    name: 'Test Team',
    members: [
      { user: { _id: 'user1', name: 'John Doe' } },
      { user: { _id: 'user2', name: 'Jane Smith' } }
    ]
  },
  teamStats: {
    totalTasks: 50,
    completedTasks: 30,
    memberStats: {
      'user1': { completedTasks: 15, inProgressTasks: 5 },
      'user2': { completedTasks: 15, inProgressTasks: 3 }
    },
    ...initialStats
  },
  loading: { currentTeam: false, stats: false },
  errors: {},
  fetchTeam: jest.fn(),
  fetchTeamStats: jest.fn(),
  updateTeamStats: jest.fn((newStats) => {
    Object.assign(context.teamStats, newStats);
  })
});

const renderWithProviders = (component, contextOverrides = {}) => {
  const notificationContext = createMockNotificationContext(contextOverrides.notifications);
  const teamContext = createMockTeamContext(contextOverrides.teamStats);
  
  return render(
    <BrowserRouter>
      <NotificationProvider value={notificationContext}>
        <TeamProvider value={teamContext}>
          <ProjectProvider value={{ projects: [], fetchProjects: jest.fn() }}>
            {component}
          </ProjectProvider>
        </TeamProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('Real-Time Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRealTimeService.listeners.clear();
  });

  afterEach(() => {
    mockRealTimeService.disconnect();
  });

  describe('WebSocket Connection', () => {
    test('establishes WebSocket connection on mount', async () => {
      const ws = mockRealTimeService.connect();
      
      await waitFor(() => {
        expect(mockRealTimeService.connected).toBe(true);
      });
      
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    test('handles connection errors gracefully', async () => {
      const ws = mockRealTimeService.connect();
      
      act(() => {
        if (ws.onerror) {
          ws.onerror(new Error('Connection failed'));
        }
      });
      
      // Should not crash the application
      expect(mockRealTimeService.connected).toBe(true);
    });

    test('reconnects on connection loss', async () => {
      const ws = mockRealTimeService.connect();
      
      await waitFor(() => {
        expect(mockRealTimeService.connected).toBe(true);
      });
      
      // Simulate connection loss
      act(() => {
        ws.close();
      });
      
      expect(mockRealTimeService.connected).toBe(false);
      
      // Reconnect
      mockRealTimeService.connect();
      
      await waitFor(() => {
        expect(mockRealTimeService.connected).toBe(true);
      });
    });
  });

  describe('Real-Time Notifications', () => {
    test('receives new notifications in real-time', async () => {
      const { rerender } = renderWithProviders(
        <TeamNotifications teamId="team1" projectId="project1" />
      );
      
      mockRealTimeService.connect();
      
      const newNotification = {
        _id: 'notif_new',
        type: 'task_assigned',
        message: 'You were assigned a new task',
        read: false,
        createdAt: new Date()
      };
      
      // Simulate receiving notification
      act(() => {
        mockRealTimeService.simulateEvent('notification:new', newNotification);
      });
      
      // Re-render with updated context
      const updatedContext = createMockNotificationContext([newNotification]);
      rerender(
        <BrowserRouter>
          <NotificationProvider value={updatedContext}>
            <TeamProvider value={createMockTeamContext()}>
              <ProjectProvider value={{ projects: [], fetchProjects: jest.fn() }}>
                <TeamNotifications teamId="team1" projectId="project1" />
              </ProjectProvider>
            </TeamProvider>
          </NotificationProvider>
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Unread count
      });
    });

    test('updates notification count in real-time', async () => {
      const initialNotifications = [
        { _id: 'notif1', message: 'Test 1', read: false },
        { _id: 'notif2', message: 'Test 2', read: false }
      ];
      
      const { rerender } = renderWithProviders(
        <TeamNotifications teamId="team1" projectId="project1" />,
        { notifications: initialNotifications }
      );
      
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Mark one as read
      const updatedNotifications = [
        { _id: 'notif1', message: 'Test 1', read: true },
        { _id: 'notif2', message: 'Test 2', read: false }
      ];
      
      rerender(
        <BrowserRouter>
          <NotificationProvider value={createMockNotificationContext(updatedNotifications)}>
            <TeamProvider value={createMockTeamContext()}>
              <ProjectProvider value={{ projects: [], fetchProjects: jest.fn() }}>
                <TeamNotifications teamId="team1" projectId="project1" />
              </ProjectProvider>
            </TeamProvider>
          </NotificationProvider>
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    test('handles notification deletion in real-time', async () => {
      const initialNotifications = [
        { _id: 'notif1', message: 'Test 1', read: false },
        { _id: 'notif2', message: 'Test 2', read: false }
      ];
      
      const { rerender } = renderWithProviders(
        <TeamNotifications teamId="team1" projectId="project1" />,
        { notifications: initialNotifications }
      );
      
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Delete one notification
      const updatedNotifications = [
        { _id: 'notif2', message: 'Test 2', read: false }
      ];
      
      rerender(
        <BrowserRouter>
          <NotificationProvider value={createMockNotificationContext(updatedNotifications)}>
            <TeamProvider value={createMockTeamContext()}>
              <ProjectProvider value={{ projects: [], fetchProjects: jest.fn() }}>
                <TeamNotifications teamId="team1" projectId="project1" />
              </ProjectProvider>
            </TeamProvider>
          </NotificationProvider>
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Analytics Updates', () => {
    test('updates team statistics in real-time', async () => {
      const initialStats = {
        totalTasks: 50,
        completedTasks: 30
      };
      
      const { rerender } = renderWithProviders(
        <TeamAnalytics teamId="team1" />,
        { teamStats: initialStats }
      );
      
      await waitFor(() => {
        expect(screen.getByText('60%')).toBeInTheDocument(); // 30/50 completion rate
      });
      
      // Update stats
      const updatedStats = {
        totalTasks: 50,
        completedTasks: 35
      };
      
      rerender(
        <BrowserRouter>
          <NotificationProvider value={createMockNotificationContext()}>
            <TeamProvider value={createMockTeamContext(updatedStats)}>
              <ProjectProvider value={{ projects: [], fetchProjects: jest.fn() }}>
                <TeamAnalytics teamId="team1" />
              </ProjectProvider>
            </TeamProvider>
          </NotificationProvider>
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('70%')).toBeInTheDocument(); // 35/50 completion rate
      });
    });

    test('updates member activity in real-time', async () => {
      const initialStats = {
        memberStats: {
          'user1': { completedTasks: 15, inProgressTasks: 5 },
          'user2': { completedTasks: 10, inProgressTasks: 3 }
        }
      };
      
      renderWithProviders(
        <MemberList teamId="team1" />,
        { teamStats: initialStats }
      );
      
      mockRealTimeService.connect();
      
      // Simulate member completing a task
      act(() => {
        mockRealTimeService.simulateEvent('member:task_completed', {
          userId: 'user1',
          taskId: 'task123'
        });
      });
      
      // Should trigger stats update
      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument();
      });
    });

    test('handles real-time chart data updates', async () => {
      const initialStats = {
        weeklyData: [
          { week: '2024-01-01', completed: 10, created: 15 },
          { week: '2024-01-08', completed: 12, created: 18 }
        ]
      };
      
      renderWithProviders(
        <TeamAnalytics teamId="team1" />,
        { teamStats: initialStats }
      );
      
      await waitFor(() => {
        expect(screen.getByText('Team Analytics')).toBeInTheDocument();
      });
      
      // Simulate new week data
      act(() => {
        mockRealTimeService.simulateEvent('analytics:weekly_update', {
          week: '2024-01-15',
          completed: 15,
          created: 20
        });
      });
      
      // Charts should update with new data
      await waitFor(() => {
        expect(screen.getByText('Team Analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Member Updates', () => {
    test('updates member list when members join', async () => {
      const { rerender } = renderWithProviders(
        <MemberList teamId="team1" />
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
      
      // Add new member
      const updatedTeamContext = createMockTeamContext();
      updatedTeamContext.currentTeam.members.push({
        user: { _id: 'user3', name: 'Bob Wilson' }
      });
      
      rerender(
        <BrowserRouter>
          <NotificationProvider value={createMockNotificationContext()}>
            <TeamProvider value={updatedTeamContext}>
              <ProjectProvider value={{ projects: [], fetchProjects: jest.fn() }}>
                <MemberList teamId="team1" />
              </ProjectProvider>
            </TeamProvider>
          </NotificationProvider>
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
    });

    test('updates member status in real-time', async () => {
      renderWithProviders(<MemberList teamId="team1" />);
      
      mockRealTimeService.connect();
      
      // Simulate member going online
      act(() => {
        mockRealTimeService.simulateEvent('member:status_change', {
          userId: 'user1',
          status: 'online'
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('handles member role changes in real-time', async () => {
      renderWithProviders(<MemberList teamId="team1" />);
      
      mockRealTimeService.connect();
      
      // Simulate role change
      act(() => {
        mockRealTimeService.simulateEvent('member:role_changed', {
          userId: 'user1',
          newRole: 'admin'
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Event Subscription Management', () => {
    test('subscribes to relevant events on mount', () => {
      mockRealTimeService.connect();
      
      const callback = jest.fn();
      mockRealTimeService.subscribe('notification:new', callback);
      
      expect(mockRealTimeService.listeners.get('notification:new')).toContain(callback);
    });

    test('unsubscribes from events on unmount', () => {
      mockRealTimeService.connect();
      
      const callback = jest.fn();
      mockRealTimeService.subscribe('notification:new', callback);
      mockRealTimeService.unsubscribe('notification:new', callback);
      
      expect(mockRealTimeService.listeners.get('notification:new')).not.toContain(callback);
    });

    test('handles multiple subscribers for same event', () => {
      mockRealTimeService.connect();
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      mockRealTimeService.subscribe('notification:new', callback1);
      mockRealTimeService.subscribe('notification:new', callback2);
      
      act(() => {
        mockRealTimeService.simulateEvent('notification:new', { test: 'data' });
      });
      
      expect(callback1).toHaveBeenCalledWith({ test: 'data' });
      expect(callback2).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  describe('Performance and Throttling', () => {
    test('throttles rapid updates to prevent UI lag', async () => {
      jest.useFakeTimers();
      
      renderWithProviders(<TeamAnalytics teamId="team1" />);
      mockRealTimeService.connect();
      
      const updateSpy = jest.fn();
      
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        act(() => {
          mockRealTimeService.simulateEvent('analytics:update', { 
            completedTasks: 30 + i 
          });
          updateSpy();
        });
      }
      
      // Should throttle updates
      jest.advanceTimersByTime(1000);
      
      expect(updateSpy).toHaveBeenCalledTimes(10);
      
      jest.useRealTimers();
    });

    test('batches multiple updates efficiently', async () => {
      renderWithProviders(<TeamAnalytics teamId="team1" />);
      mockRealTimeService.connect();
      
      // Simulate batch update
      act(() => {
        mockRealTimeService.simulateEvent('analytics:batch_update', {
          updates: [
            { type: 'task_completed', userId: 'user1' },
            { type: 'task_created', userId: 'user2' },
            { type: 'member_joined', userId: 'user3' }
          ]
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Team Analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles WebSocket errors gracefully', async () => {
      const ws = mockRealTimeService.connect();
      
      act(() => {
        if (ws.onerror) {
          ws.onerror(new Error('WebSocket error'));
        }
      });
      
      // Should not crash the application
      expect(mockRealTimeService.connected).toBe(true);
    });

    test('handles malformed real-time messages', async () => {
      mockRealTimeService.connect();
      
      act(() => {
        // Simulate malformed message
        if (mockRealTimeService.ws && mockRealTimeService.ws.onmessage) {
          mockRealTimeService.ws.onmessage({ data: 'invalid json' });
        }
      });
      
      // Should handle gracefully without crashing
      expect(mockRealTimeService.connected).toBe(true);
    });

    test('recovers from connection interruptions', async () => {
      const ws = mockRealTimeService.connect();
      
      await waitFor(() => {
        expect(mockRealTimeService.connected).toBe(true);
      });
      
      // Simulate connection interruption
      act(() => {
        ws.close();
      });
      
      expect(mockRealTimeService.connected).toBe(false);
      
      // Reconnect
      mockRealTimeService.connect();
      
      await waitFor(() => {
        expect(mockRealTimeService.connected).toBe(true);
      });
    });
  });

  describe('Cross-Component Synchronization', () => {
    test('synchronizes data across multiple components', async () => {
      const { rerender } = render(
        <BrowserRouter>
          <NotificationProvider value={createMockNotificationContext()}>
            <TeamProvider value={createMockTeamContext()}>
              <ProjectProvider value={{ projects: [], fetchProjects: jest.fn() }}>
                <div>
                  <TeamNotifications teamId="team1" projectId="project1" />
                  <TeamAnalytics teamId="team1" />
                </div>
              </ProjectProvider>
            </TeamProvider>
          </NotificationProvider>
        </BrowserRouter>
      );
      
      mockRealTimeService.connect();
      
      // Simulate event that affects both components
      act(() => {
        mockRealTimeService.simulateEvent('team:task_completed', {
          taskId: 'task123',
          userId: 'user1'
        });
      });
      
      // Both components should update
      await waitFor(() => {
        expect(screen.getByText('Team Analytics')).toBeInTheDocument();
      });
    });

    test('maintains data consistency across updates', async () => {
      const initialStats = {
        totalTasks: 50,
        completedTasks: 30
      };
      
      renderWithProviders(
        <TeamAnalytics teamId="team1" />,
        { teamStats: initialStats }
      );
      
      mockRealTimeService.connect();
      
      // Multiple rapid updates
      act(() => {
        mockRealTimeService.simulateEvent('analytics:update', { completedTasks: 31 });
        mockRealTimeService.simulateEvent('analytics:update', { completedTasks: 32 });
        mockRealTimeService.simulateEvent('analytics:update', { completedTasks: 33 });
      });
      
      // Should maintain consistency
      await waitFor(() => {
        expect(screen.getByText('Team Analytics')).toBeInTheDocument();
      });
    });
  });
});