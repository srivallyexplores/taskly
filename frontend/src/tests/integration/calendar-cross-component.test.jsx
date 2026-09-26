import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import all calendar components for cross-component testing
import { CalendarProvider } from '../../context/CalendarContext';
import Calendar from '../../components/calendar/Calendar';
import CalendarHeader from '../../components/calendar/CalendarHeader';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import MonthView from '../../components/calendar/MonthView';
import WeekView from '../../components/calendar/WeekView';
import DayView from '../../components/calendar/DayView';
import AgendaView from '../../components/calendar/AgendaView';
import CalendarFilters from '../../components/calendar/CalendarFilters';
import CalendarSearch from '../../components/calendar/CalendarSearch';
import CalendarTaskCard from '../../components/calendar/CalendarTaskCard';
import TaskQuickCreate from '../../components/calendar/TaskQuickCreate';
import CalendarNotifications from '../../components/calendar/CalendarNotifications';
import CalendarReminders from '../../components/calendar/CalendarReminders';
import CalendarPreferencesPanel from '../../components/calendar/CalendarPreferencesPanel';

// Mock data
const mockTasks = [
  {
    _id: '1',
    title: 'Cross Component Test Task 1',
    description: 'First test task for cross-component testing',
    priority: 'high',
    status: 'pending',
    due: new Date('2024-01-15T10:00:00Z'),
    tags: ['cross-test', 'component'],
    createdAt: new Date('2024-01-10T08:00:00Z'),
    updatedAt: new Date('2024-01-10T08:00:00Z')
  },
  {
    _id: '2',
    title: 'Cross Component Test Task 2',
    description: 'Second test task for cross-component testing',
    priority: 'medium',
    status: 'in-progress',
    due: new Date('2024-01-16T14:00:00Z'),
    tags: ['cross-test', 'integration'],
    createdAt: new Date('2024-01-11T09:00:00Z'),
    updatedAt: new Date('2024-01-11T09:00:00Z')
  },
  {
    _id: '3',
    title: 'Cross Component Test Task 3',
    description: 'Third test task for cross-component testing',
    priority: 'low',
    status: 'completed',
    due: new Date('2024-01-14T16:00:00Z'),
    tags: ['cross-test', 'completed'],
    createdAt: new Date('2024-01-12T10:00:00Z'),
    updatedAt: new Date('2024-01-14T16:30:00Z'),
    completedAt: new Date('2024-01-14T16:30:00Z')
  }
];

const mockCalendarContext = {
  allTasks: mockTasks,
  filteredTasks: mockTasks,
  currentView: 'month',
  setCurrentView: jest.fn(),
  currentDate: new Date('2024-01-15'),
  setCurrentDate: jest.fn(),
  selectedDate: new Date('2024-01-15'),
  setSelectedDate: jest.fn(),
  selectedTask: null,
  setSelectedTask: jest.fn(),
  filters: {},
  setFilters: jest.fn(),
  searchQuery: '',
  setSearchQuery: jest.fn(),
  searchResults: [],
  setSearchResults: jest.fn(),
  refreshTasks: jest.fn()
};

// Test wrapper
const TestWrapper = ({ children, contextOverrides = {} }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const contextValue = { ...mockCalendarContext, ...contextOverrides };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CalendarProvider value={contextValue}>
          {children}
        </CalendarProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Calendar Cross-Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Header and View Integration', () => {
    it('should synchronize header controls with view changes', async () => {
      const user = userEvent.setup();
      const mockSetCurrentView = jest.fn();

      render(
        <TestWrapper contextOverrides={{ setCurrentView: mockSetCurrentView }}>
          <CalendarHeader />
          <div data-testid="view-container">
            <MonthView />
            <WeekView />
            <DayView />
            <AgendaView />
          </div>
        </TestWrapper>
      );

      // Test view switching from header
      await user.click(screen.getByTestId('week-view-button'));
      expect(mockSetCurrentView).toHaveBeenCalledWith('week');

      await user.click(screen.getByTestId('day-view-button'));
      expect(mockSetCurrentView).toHaveBeenCalledWith('day');

      await user.click(screen.getByTestId('agenda-view-button'));
      expect(mockSetCurrentView).toHaveBeenCalledWith('agenda');
    });

    it('should synchronize date navigation across components', async () => {
      const user = userEvent.setup();
      const mockSetCurrentDate = jest.fn();

      render(
        <TestWrapper contextOverrides={{ setCurrentDate: mockSetCurrentDate }}>
          <CalendarHeader />
          <MonthView />
        </TestWrapper>
      );

      // Test date navigation
      await user.click(screen.getByTestId('next-month-button'));
      expect(mockSetCurrentDate).toHaveBeenCalled();

      await user.click(screen.getByTestId('prev-month-button'));
      expect(mockSetCurrentDate).toHaveBeenCalled();

      await user.click(screen.getByTestId('today-button'));
      expect(mockSetCurrentDate).toHaveBeenCalled();
    });
  });

  describe('Filter and Search Integration', () => {
    it('should apply filters across all view components', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      const filteredTasks = [mockTasks[0]]; // Only high priority task

      render(
        <TestWrapper contextOverrides={{ 
          setFilters: mockSetFilters,
          filteredTasks: filteredTasks
        }}>
          <CalendarFilters />
          <MonthView />
          <WeekView />
          <DayView />
          <AgendaView />
        </TestWrapper>
      );

      // Open filters
      await user.click(screen.getByTestId('filters-button'));

      // Apply priority filter
      await user.check(screen.getByTestId('priority-high-filter'));

      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: ['high']
        })
      );

      // Verify filtered tasks appear in all views
      const taskCards = screen.getAllByTestId('task-card');
      taskCards.forEach(card => {
        expect(card).toHaveTextContent('Cross Component Test Task 1');
      });
    });

    it('should synchronize search across components', async () => {
      const user = userEvent.setup();
      const mockSetSearchQuery = jest.fn();
      const mockSetSearchResults = jest.fn();
      const searchResults = [mockTasks[0]];

      render(
        <TestWrapper contextOverrides={{ 
          setSearchQuery: mockSetSearchQuery,
          setSearchResults: mockSetSearchResults,
          searchResults: searchResults,
          searchQuery: 'Cross Component Test Task 1'
        }}>
          <CalendarSearch />
          <MonthView />
          <AgendaView />
        </TestWrapper>
      );

      // Perform search
      await user.click(screen.getByTestId('search-button'));
      await user.type(screen.getByTestId('search-input'), 'Cross Component Test Task 1');

      expect(mockSetSearchQuery).toHaveBeenCalledWith('Cross Component Test Task 1');

      // Verify search results are highlighted
      await waitFor(() => {
        const highlightedTasks = screen.getAllByTestId('task-card');
        expect(highlightedTasks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Task Creation and Management Integration', () => {
    it('should create task and update all relevant components', async () => {
      const user = userEvent.setup();
      const mockRefreshTasks = jest.fn();
      const mockSetAllTasks = jest.fn();

      render(
        <TestWrapper contextOverrides={{ 
          refreshTasks: mockRefreshTasks,
          setAllTasks: mockSetAllTasks
        }}>
          <MonthView />
          <TaskQuickCreate />
          <CalendarNotifications />
        </TestWrapper>
      );

      // Click on date cell to create task
      await user.click(screen.getAllByTestId('calendar-date-cell')[0]);

      // Fill task details
      await waitFor(() => {
        expect(screen.getByTestId('task-quick-create')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('task-title-input'), 'New Cross Component Task');
      await user.type(screen.getByTestId('task-description-input'), 'Created for integration testing');
      await user.selectOptions(screen.getByTestId('task-priority-select'), 'high');

      // Save task
      await user.click(screen.getByTestId('save-task-button'));

      // Verify task creation triggers updates
      expect(mockRefreshTasks).toHaveBeenCalled();
    });

    it('should update task and synchronize across components', async () => {
      const user = userEvent.setup();
      const mockSetSelectedTask = jest.fn();
      const updatedTask = { ...mockTasks[0], title: 'Updated Cross Component Task' };

      render(
        <TestWrapper contextOverrides={{ 
          selectedTask: updatedTask,
          setSelectedTask: mockSetSelectedTask
        }}>
          <MonthView />
          <CalendarTaskCard task={mockTasks[0]} />
          <AgendaView />
        </TestWrapper>
      );

      // Click on task to select
      await user.click(screen.getAllByTestId('task-card')[0]);

      expect(mockSetSelectedTask).toHaveBeenCalledWith(mockTasks[0]);

      // Verify task selection is reflected across components
      await waitFor(() => {
        const selectedCards = screen.getAllByTestId('task-card');
        selectedCards.forEach(card => {
          expect(card).toHaveClass('selected');
        });
      });
    });

    it('should handle drag and drop across view components', async () => {
      const user = userEvent.setup();
      const mockUpdateTask = jest.fn();

      render(
        <TestWrapper contextOverrides={{ updateTask: mockUpdateTask }}>
          <WeekView />
          <DayView />
        </TestWrapper>
      );

      // Get task and target elements
      const taskCard = screen.getAllByTestId('task-card')[0];
      const targetCell = screen.getAllByTestId('calendar-date-cell')[2];

      // Simulate drag and drop
      await act(async () => {
        fireEvent.dragStart(taskCard);
        fireEvent.dragEnter(targetCell);
        fireEvent.dragOver(targetCell);
        fireEvent.drop(targetCell);
        fireEvent.dragEnd(taskCard);
      });

      // Verify drag and drop triggers task update
      await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalled();
      });
    });
  });

  describe('Notification and Reminder Integration', () => {
    it('should show notifications across all components', async () => {
      const overdueTask = {
        ...mockTasks[0],
        due: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        status: 'pending'
      };

      render(
        <TestWrapper contextOverrides={{ 
          allTasks: [overdueTask, ...mockTasks.slice(1)]
        }}>
          <CalendarNotifications />
          <CalendarReminders />
          <MonthView />
          <AgendaView />
        </TestWrapper>
      );

      // Verify overdue notification appears
      await waitFor(() => {
        expect(screen.getByTestId('overdue-notification')).toBeInTheDocument();
      });

      // Verify overdue task is highlighted in views
      const overdueTasks = screen.getAllByTestId('task-card');
      const overdueTaskCard = overdueTasks.find(card => 
        card.textContent.includes('Cross Component Test Task 1')
      );
      expect(overdueTaskCard).toHaveClass('overdue');
    });

    it('should synchronize reminder settings across components', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarReminders />
          <CalendarPreferencesPanel isOpen={true} />
        </TestWrapper>
      );

      // Open reminder settings
      await user.click(screen.getByTestId('reminder-settings-button'));

      // Change reminder settings
      await user.check(screen.getByTestId('enable-reminders-checkbox'));
      await user.selectOptions(screen.getByTestId('reminder-time-select'), '30');

      // Verify settings are applied to reminder component
      await waitFor(() => {
        expect(screen.getByTestId('reminder-enabled-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('Preferences Integration', () => {
    it('should apply preferences across all components', async () => {
      const user = userEvent.setup();
      const preferences = {
        compactMode: true,
        showWeekNumbers: true,
        timeFormat: '24h',
        startOfWeek: 1 // Monday
      };

      render(
        <TestWrapper>
          <CalendarPreferencesPanel isOpen={true} />
          <CalendarHeader />
          <MonthView />
          <WeekView />
        </TestWrapper>
      );

      // Apply compact mode
      await user.check(screen.getByTestId('compact-mode-checkbox'));

      // Verify compact mode is applied
      await waitFor(() => {
        expect(screen.getByTestId('calendar-container')).toHaveClass('compact');
      });

      // Apply 24-hour format
      await user.selectOptions(screen.getByTestId('time-format-select'), '24h');

      // Verify time format is applied
      await waitFor(() => {
        const timeElements = screen.getAllByTestId('time-display');
        timeElements.forEach(element => {
          expect(element.textContent).toMatch(/\d{2}:\d{2}/); // 24-hour format
        });
      });

      // Change start of week
      await user.selectOptions(screen.getByTestId('start-of-week-select'), '1');

      // Verify week starts with Monday
      await waitFor(() => {
        const weekHeaders = screen.getAllByTestId('week-header');
        expect(weekHeaders[0]).toHaveTextContent('Mon');
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across components', async () => {
      const user = userEvent.setup();
      let currentTasks = [...mockTasks];
      const mockSetAllTasks = jest.fn((newTasks) => {
        currentTasks = newTasks;
      });

      const { rerender } = render(
        <TestWrapper contextOverrides={{ 
          allTasks: currentTasks,
          setAllTasks: mockSetAllTasks
        }}>
          <MonthView />
          <WeekView />
          <AgendaView />
          <CalendarNotifications />
        </TestWrapper>
      );

      // Complete a task
      const taskCard = screen.getAllByTestId('task-card')[0];
      await user.hover(taskCard);
      await user.click(screen.getByTestId('complete-task-button'));

      // Update the context with completed task
      const updatedTasks = currentTasks.map(task => 
        task._id === '1' ? { ...task, status: 'completed' } : task
      );

      rerender(
        <TestWrapper contextOverrides={{ 
          allTasks: updatedTasks,
          setAllTasks: mockSetAllTasks
        }}>
          <MonthView />
          <WeekView />
          <AgendaView />
          <CalendarNotifications />
        </TestWrapper>
      );

      // Verify task completion is reflected across all components
      await waitFor(() => {
        const completedTasks = screen.getAllByTestId('task-card');
        const completedTask = completedTasks.find(card => 
          card.textContent.includes('Cross Component Test Task 1')
        );
        expect(completedTask).toHaveClass('completed');
      });

      // Verify notification count is updated
      const completedCount = screen.getByTestId('completed-tasks-count');
      expect(completedCount).toHaveTextContent('2'); // One more completed task
    });

    it('should handle concurrent updates gracefully', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      const mockSetSearchQuery = jest.fn();
      const mockSetCurrentView = jest.fn();

      render(
        <TestWrapper contextOverrides={{ 
          setFilters: mockSetFilters,
          setSearchQuery: mockSetSearchQuery,
          setCurrentView: mockSetCurrentView
        }}>
          <CalendarHeader />
          <CalendarFilters />
          <CalendarSearch />
          <MonthView />
        </TestWrapper>
      );

      // Perform multiple operations simultaneously
      await Promise.all([
        user.click(screen.getByTestId('week-view-button')),
        user.click(screen.getByTestId('filters-button')),
        user.click(screen.getByTestId('search-button'))
      ]);

      // Verify all operations completed
      expect(mockSetCurrentView).toHaveBeenCalledWith('week');
      await waitFor(() => {
        expect(screen.getByTestId('filters-panel')).toBeInTheDocument();
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle component errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock a component that throws an error
      const ErrorComponent = () => {
        throw new Error('Component error');
      };

      render(
        <TestWrapper>
          <CalendarHeader />
          <ErrorComponent />
          <MonthView />
        </TestWrapper>
      );

      // Verify other components still work despite error
      await user.click(screen.getByTestId('next-month-button'));

      // Verify error was caught and logged
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should recover from state inconsistencies', async () => {
      const user = userEvent.setup();
      const inconsistentTasks = [
        { ...mockTasks[0], _id: null }, // Invalid task
        mockTasks[1],
        mockTasks[2]
      ];

      render(
        <TestWrapper contextOverrides={{ allTasks: inconsistentTasks }}>
          <MonthView />
          <AgendaView />
          <CalendarNotifications />
        </TestWrapper>
      );

      // Verify components handle invalid data gracefully
      await waitFor(() => {
        const validTasks = screen.getAllByTestId('task-card');
        expect(validTasks.length).toBe(2); // Only valid tasks shown
      });

      // Verify components remain functional
      await user.click(screen.getByTestId('agenda-view-button'));
      await waitFor(() => {
        expect(screen.getByTestId('agenda-view')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently across components', async () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        _id: `task-${i}`,
        title: `Performance Test Task ${i}`,
        priority: ['high', 'medium', 'low'][i % 3],
        status: ['pending', 'in-progress', 'completed'][i % 3],
        due: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['performance', 'test']
      }));

      const startTime = Date.now();

      render(
        <TestWrapper contextOverrides={{ allTasks: largeTasks }}>
          <MonthView />
          <WeekView />
          <AgendaView />
          <CalendarNotifications />
        </TestWrapper>
      );

      const renderTime = Date.now() - startTime;

      // Verify components render within reasonable time (2 seconds)
      expect(renderTime).toBeLessThan(2000);

      // Verify components are still responsive
      const user = userEvent.setup();
      const navigationStart = Date.now();
      
      await user.click(screen.getByTestId('week-view-button'));
      
      const navigationTime = Date.now() - navigationStart;
      expect(navigationTime).toBeLessThan(1000);
    });
  });
});