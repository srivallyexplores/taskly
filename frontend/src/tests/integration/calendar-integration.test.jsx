import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarProvider } from '../../context/CalendarContext';
import { TaskProvider } from '../../context/TaskContext';
import { AuthProvider } from '../../context/AuthContext';
import { NotificationProvider } from '../../context/NotificationContext';
import Calendar from '../../components/calendar/Calendar';
import CalendarTaskIntegration from '../../components/calendar/CalendarTaskIntegration';

// Mock API calls
const mockApi = {
  tasks: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  auth: {
    getCurrentUser: jest.fn()
  },
  preferences: {
    get: jest.fn(),
    update: jest.fn()
  }
};

// Mock fetch
global.fetch = jest.fn();

// Test data
const mockTasks = [
  {
    _id: '1',
    title: 'Integration Test Task 1',
    description: 'First test task',
    priority: 'high',
    status: 'pending',
    due: new Date('2024-01-15T10:00:00Z'),
    tags: ['integration', 'test'],
    createdAt: new Date('2024-01-10T08:00:00Z'),
    updatedAt: new Date('2024-01-10T08:00:00Z')
  },
  {
    _id: '2',
    title: 'Integration Test Task 2',
    description: 'Second test task',
    priority: 'medium',
    status: 'in-progress',
    due: new Date('2024-01-16T14:00:00Z'),
    tags: ['integration', 'test'],
    createdAt: new Date('2024-01-11T09:00:00Z'),
    updatedAt: new Date('2024-01-11T09:00:00Z')
  },
  {
    _id: '3',
    title: 'Integration Test Task 3',
    description: 'Third test task',
    priority: 'low',
    status: 'completed',
    due: new Date('2024-01-14T16:00:00Z'),
    tags: ['integration', 'test'],
    createdAt: new Date('2024-01-12T10:00:00Z'),
    updatedAt: new Date('2024-01-14T16:30:00Z'),
    completedAt: new Date('2024-01-14T16:30:00Z')
  }
];

const mockUser = {
  _id: 'user1',
  email: 'test@example.com',
  name: 'Test User',
  token: 'mock-jwt-token'
};

const mockPreferences = {
  defaultView: 'month',
  startOfWeek: 0,
  timeFormat: '12h',
  enableNotifications: true,
  theme: 'system'
};

// Test wrapper component
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <TaskProvider>
              <CalendarProvider>
                {children}
                <CalendarTaskIntegration />
              </CalendarProvider>
            </TaskProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Calendar Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default API responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/tasks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTasks)
        });
      }
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser)
        });
      }
      if (url.includes('/api/user/calendar-preferences')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPreferences)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  describe('Calendar and Task Manager Integration', () => {
    it('should synchronize tasks between calendar and task manager', async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      // Check that tasks are loaded and displayed
      await waitFor(() => {
        expect(screen.getByText('Integration Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('Integration Test Task 2')).toBeInTheDocument();
        expect(screen.getByText('Integration Test Task 3')).toBeInTheDocument();
      });

      // Verify API was called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks'),
        expect.any(Object)
      );
    });

    it('should create task from calendar and sync with task manager', async () => {
      const user = userEvent.setup();
      
      // Mock successful task creation
      fetch.mockImplementationOnce((url, options) => {
        if (url.includes('/api/tasks') && options.method === 'POST') {
          const newTask = {
            _id: '4',
            ...JSON.parse(options.body),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(newTask)
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      // Click on a date cell to create task
      const dateCell = screen.getAllByTestId('calendar-date-cell')[0];
      await user.click(dateCell);

      // Fill in task details
      await waitFor(() => {
        expect(screen.getByTestId('task-quick-create')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('task-title-input'), 'New Integration Task');
      await user.type(screen.getByTestId('task-description-input'), 'Created from calendar');
      await user.selectOptions(screen.getByTestId('task-priority-select'), 'high');

      // Save task
      await user.click(screen.getByTestId('save-task-button'));

      // Verify task creation API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/tasks'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('New Integration Task')
          })
        );
      });

      // Verify task appears in calendar
      await waitFor(() => {
        expect(screen.getByText('New Integration Task')).toBeInTheDocument();
      });
    });

    it('should update task from calendar and sync with task manager', async () => {
      const user = userEvent.setup();
      
      // Mock successful task update
      fetch.mockImplementationOnce((url, options) => {
        if (url.includes('/api/tasks/1') && options.method === 'PUT') {
          const updatedTask = {
            ...mockTasks[0],
            ...JSON.parse(options.body),
            updatedAt: new Date().toISOString()
          };
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(updatedTask)
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Integration Test Task 1')).toBeInTheDocument();
      });

      // Click on task to edit
      await user.click(screen.getByText('Integration Test Task 1'));

      await waitFor(() => {
        expect(screen.getByTestId('task-details-modal')).toBeInTheDocument();
      });

      // Click edit button
      await user.click(screen.getByTestId('edit-task-button'));

      // Update task title
      const titleInput = screen.getByTestId('task-title-input');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Integration Task 1');

      // Save changes
      await user.click(screen.getByTestId('save-task-button'));

      // Verify update API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/tasks/1'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('Updated Integration Task 1')
          })
        );
      });

      // Verify task is updated in calendar
      await waitFor(() => {
        expect(screen.getByText('Updated Integration Task 1')).toBeInTheDocument();
      });
    });

    it('should handle drag and drop task updates', async () => {
      const user = userEvent.setup();
      
      // Mock successful task update for drag and drop
      fetch.mockImplementationOnce((url, options) => {
        if (url.includes('/api/tasks/1') && options.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ...mockTasks[0],
              due: JSON.parse(options.body).due,
              updatedAt: new Date().toISOString()
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Integration Test Task 1')).toBeInTheDocument();
      });

      // Get source and target date cells
      const dateCells = screen.getAllByTestId('calendar-date-cell');
      const sourceCell = dateCells[0];
      const targetCell = dateCells[2];

      // Simulate drag and drop
      const taskCard = screen.getByText('Integration Test Task 1');
      
      await act(async () => {
        fireEvent.dragStart(taskCard);
        fireEvent.dragEnter(targetCell);
        fireEvent.dragOver(targetCell);
        fireEvent.drop(targetCell);
        fireEvent.dragEnd(taskCard);
      });

      // Verify update API call was made
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/tasks/1'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('due')
          })
        );
      });
    });

    it('should delete task from calendar and sync with task manager', async () => {
      const user = userEvent.setup();
      
      // Mock successful task deletion
      fetch.mockImplementationOnce((url, options) => {
        if (url.includes('/api/tasks/1') && options.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Task deleted' })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Integration Test Task 1')).toBeInTheDocument();
      });

      // Right-click on task for context menu
      const taskCard = screen.getByText('Integration Test Task 1');
      await user.pointer({ keys: '[MouseRight]', target: taskCard });

      await waitFor(() => {
        expect(screen.getByTestId('delete-task-option')).toBeInTheDocument();
      });

      // Click delete option
      await user.click(screen.getByTestId('delete-task-option'));

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByTestId('confirm-delete-button')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('confirm-delete-button'));

      // Verify delete API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/tasks/1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });

      // Verify task is removed from calendar
      await waitFor(() => {
        expect(screen.queryByText('Integration Test Task 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Calendar View Integration', () => {
    it('should persist view changes across sessions', async () => {
      const user = userEvent.setup();
      
      // Mock preferences update
      fetch.mockImplementationOnce((url, options) => {
        if (url.includes('/api/user/calendar-preferences') && options.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ...mockPreferences, lastView: 'week' })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      // Switch to week view
      await user.click(screen.getByTestId('week-view-button'));

      await waitFor(() => {
        expect(screen.getByTestId('week-view')).toBeInTheDocument();
      });

      // Verify preferences update API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/calendar-preferences'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('lastView')
          })
        );
      });
    });

    it('should synchronize filters across calendar and task list views', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      // Open filters
      await user.click(screen.getByTestId('filters-button'));

      await waitFor(() => {
        expect(screen.getByTestId('filters-panel')).toBeInTheDocument();
      });

      // Apply priority filter
      await user.check(screen.getByTestId('priority-high-filter'));

      // Verify only high priority tasks are visible
      await waitFor(() => {
        expect(screen.getByText('Integration Test Task 1')).toBeInTheDocument(); // high priority
        expect(screen.queryByText('Integration Test Task 2')).not.toBeInTheDocument(); // medium priority
        expect(screen.queryByText('Integration Test Task 3')).not.toBeInTheDocument(); // low priority
      });

      // Switch to agenda view
      await user.click(screen.getByTestId('agenda-view-button'));

      await waitFor(() => {
        expect(screen.getByTestId('agenda-view')).toBeInTheDocument();
      });

      // Verify filter is still applied in agenda view
      await waitFor(() => {
        expect(screen.getByText('Integration Test Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Integration Test Task 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Integration Test Task 3')).not.toBeInTheDocument();
      });
    });
  });

  describe('Notification Integration', () => {
    it('should show notifications for task operations', async () => {
      const user = userEvent.setup();
      
      // Mock successful task creation
      fetch.mockImplementationOnce((url, options) => {
        if (url.includes('/api/tasks') && options.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              _id: '4',
              ...JSON.parse(options.body),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      // Create a task
      const dateCell = screen.getAllByTestId('calendar-date-cell')[0];
      await user.click(dateCell);

      await waitFor(() => {
        expect(screen.getByTestId('task-quick-create')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('task-title-input'), 'Notification Test Task');
      await user.click(screen.getByTestId('save-task-button'));

      // Verify success notification appears
      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
      });
    });

    it('should show overdue task notifications', async () => {
      const overdueTask = {
        ...mockTasks[0],
        due: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        status: 'pending'
      };

      fetch.mockImplementationOnce((url) => {
        if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([overdueTask])
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      // Verify overdue notification appears
      await waitFor(() => {
        expect(screen.getByTestId('overdue-notification')).toBeInTheDocument();
        expect(screen.getByText(/1 overdue task/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Integration', () => {
    it('should search across all calendar views', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      // Open search
      await user.click(screen.getByTestId('search-button'));

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      // Search for a task
      await user.type(screen.getByTestId('search-input'), 'Integration Test Task 1');

      // Verify search results appear
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
        expect(screen.getByText('Integration Test Task 1')).toBeInTheDocument();
      });

      // Click on search result
      await user.click(screen.getByTestId('search-result-1'));

      // Verify task is highlighted in calendar
      await waitFor(() => {
        expect(screen.getByTestId('task-card-1')).toHaveClass('highlighted');
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      fetch.mockImplementationOnce(() => {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' })
        });
      });

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      // Try to create a task
      const dateCell = screen.getAllByTestId('calendar-date-cell')[0];
      await user.click(dateCell);

      await waitFor(() => {
        expect(screen.getByTestId('task-quick-create')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('task-title-input'), 'Error Test Task');
      await user.click(screen.getByTestId('save-task-button'));

      // Verify error notification appears
      await waitFor(() => {
        expect(screen.getByText(/failed to create task/i)).toBeInTheDocument();
      });
    });

    it('should handle network failures with retry mechanism', async () => {
      const user = userEvent.setup();
      let callCount = 0;
      
      // Mock network failure then success
      fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            _id: '4',
            title: 'Retry Test Task',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        });
      });

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      // Try to create a task
      const dateCell = screen.getAllByTestId('calendar-date-cell')[0];
      await user.click(dateCell);

      await waitFor(() => {
        expect(screen.getByTestId('task-quick-create')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('task-title-input'), 'Retry Test Task');
      await user.click(screen.getByTestId('save-task-button'));

      // Wait for retry and success
      await waitFor(() => {
        expect(screen.getByText('Retry Test Task')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify retry mechanism worked
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeMockTasks = Array.from({ length: 100 }, (_, i) => ({
        _id: `task-${i}`,
        title: `Performance Test Task ${i}`,
        description: `Task ${i} for performance testing`,
        priority: ['high', 'medium', 'low'][i % 3],
        status: ['pending', 'in-progress', 'completed'][i % 3],
        due: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['performance', 'test'],
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
      }));

      fetch.mockImplementationOnce((url) => {
        if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(largeMockTasks)
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      const startTime = Date.now();

      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
      });

      const loadTime = Date.now() - startTime;

      // Verify calendar loads within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);

      // Verify some tasks are visible
      await waitFor(() => {
        expect(screen.getByText('Performance Test Task 0')).toBeInTheDocument();
      });
    });
  });
});