import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarProvider } from '../../../context/CalendarContext';
import CalendarNotifications from '../CalendarNotifications';
import { dateUtils } from '../../../utils/dateUtils';

// Mock dateUtils
jest.mock('../../../utils/dateUtils', () => ({
  dateUtils: {
    isTaskDueToday: jest.fn(),
    isTaskOverdue: jest.fn(),
    formatTaskDueTime: jest.fn(),
    getTasksForDate: jest.fn()
  }
}));

// Mock tasks
const mockTasks = [
  {
    _id: '1',
    title: 'Today Task',
    priority: 'high',
    status: 'pending',
    due: new Date('2024-01-15T10:00:00Z')
  },
  {
    _id: '2',
    title: 'Overdue Task',
    priority: 'medium',
    status: 'pending',
    due: new Date('2024-01-14T09:00:00Z')
  },
  {
    _id: '3',
    title: 'Future Task',
    priority: 'low',
    status: 'pending',
    due: new Date('2024-01-16T14:00:00Z')
  }
];

const mockCalendarContext = {
  allTasks: mockTasks,
  currentDate: new Date('2024-01-15T08:00:00Z')
};

const renderWithContext = (component, contextValue = mockCalendarContext) => {
  return render(
    <CalendarProvider value={contextValue}>
      {component}
    </CalendarProvider>
  );
};

describe('CalendarNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup dateUtils mocks
    dateUtils.isTaskDueToday.mockImplementation(task => 
      task._id === '1'
    );
    dateUtils.isTaskOverdue.mockImplementation(task => 
      task._id === '2'
    );
    dateUtils.formatTaskDueTime.mockReturnValue('10:00 AM');
    dateUtils.getTasksForDate.mockReturnValue([mockTasks[0]]);
  });

  describe('Today Tasks Indicator', () => {
    it('displays today tasks count', () => {
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByText(/1 task due today/i)).toBeInTheDocument();
    });

    it('shows different message for multiple tasks', () => {
      dateUtils.isTaskDueToday.mockImplementation(task => 
        task._id === '1' || task._id === '3'
      );
      
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByText(/2 tasks due today/i)).toBeInTheDocument();
    });

    it('shows no tasks message when no tasks due today', () => {
      dateUtils.isTaskDueToday.mockReturnValue(false);
      
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByText(/no tasks due today/i)).toBeInTheDocument();
    });

    it('displays today tasks with priority indicators', () => {
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByText('Today Task')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('shows task due times', () => {
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });
  });

  describe('Overdue Tasks Indicator', () => {
    it('displays overdue tasks count', () => {
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByText(/1 overdue task/i)).toBeInTheDocument();
    });

    it('shows different message for multiple overdue tasks', () => {
      dateUtils.isTaskOverdue.mockImplementation(task => 
        task._id === '2' || task._id === '3'
      );
      
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByText(/2 overdue tasks/i)).toBeInTheDocument();
    });

    it('hides overdue section when no overdue tasks', () => {
      dateUtils.isTaskOverdue.mockReturnValue(false);
      
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
    });

    it('displays overdue tasks with warning styling', () => {
      renderWithContext(<CalendarNotifications />);
      
      const overdueSection = screen.getByText(/overdue/i).closest('div');
      expect(overdueSection).toHaveClass('text-red-600');
    });

    it('shows overdue task details', () => {
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByText('Overdue Task')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('shows today indicator on current date', () => {
      renderWithContext(<CalendarNotifications />);
      
      const todayIndicator = screen.getByTestId('today-indicator');
      expect(todayIndicator).toBeInTheDocument();
      expect(todayIndicator).toHaveClass('bg-primary-600');
    });

    it('displays task count badge', () => {
      renderWithContext(<CalendarNotifications />);
      
      const taskBadge = screen.getByTestId('task-count-badge');
      expect(taskBadge).toBeInTheDocument();
      expect(taskBadge).toHaveTextContent('1');
    });

    it('shows different colors for different priority levels', () => {
      const highPriorityContext = {
        ...mockCalendarContext,
        allTasks: [{ ...mockTasks[0], priority: 'high' }]
      };
      
      renderWithContext(<CalendarNotifications />, highPriorityContext);
      
      const priorityIndicator = screen.getByText('high');
      expect(priorityIndicator).toHaveClass('bg-red-100');
    });

    it('pulses for urgent tasks', () => {
      const urgentTaskContext = {
        ...mockCalendarContext,
        allTasks: [{ ...mockTasks[0], priority: 'high', urgent: true }]
      };
      
      renderWithContext(<CalendarNotifications />, urgentTaskContext);
      
      const urgentIndicator = screen.getByTestId('urgent-indicator');
      expect(urgentIndicator).toHaveClass('animate-pulse');
    });
  });

  describe('Interactive Features', () => {
    it('expands task list when clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarNotifications />);
      
      const todaySection = screen.getByText(/task due today/i);
      await user.click(todaySection);
      
      expect(screen.getByText('Today Task')).toBeVisible();
    });

    it('collapses task list when clicked again', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarNotifications />);
      
      const todaySection = screen.getByText(/task due today/i);
      
      // Expand
      await user.click(todaySection);
      expect(screen.getByText('Today Task')).toBeVisible();
      
      // Collapse
      await user.click(todaySection);
      expect(screen.queryByText('Today Task')).not.toBeVisible();
    });

    it('navigates to task when task is clicked', async () => {
      const user = userEvent.setup();
      const mockOnTaskClick = jest.fn();
      
      renderWithContext(<CalendarNotifications onTaskClick={mockOnTaskClick} />);
      
      const todaySection = screen.getByText(/task due today/i);
      await user.click(todaySection);
      
      const taskItem = screen.getByText('Today Task');
      await user.click(taskItem);
      
      expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
    });

    it('shows quick actions on task hover', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarNotifications />);
      
      const todaySection = screen.getByText(/task due today/i);
      await user.click(todaySection);
      
      const taskItem = screen.getByText('Today Task');
      await user.hover(taskItem);
      
      expect(screen.getByTitle('Mark Complete')).toBeInTheDocument();
      expect(screen.getByTitle('Edit Task')).toBeInTheDocument();
    });

    it('marks task complete when complete button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnTaskComplete = jest.fn();
      
      renderWithContext(<CalendarNotifications onTaskComplete={mockOnTaskComplete} />);
      
      const todaySection = screen.getByText(/task due today/i);
      await user.click(todaySection);
      
      const taskItem = screen.getByText('Today Task');
      await user.hover(taskItem);
      
      const completeButton = screen.getByTitle('Mark Complete');
      await user.click(completeButton);
      
      expect(mockOnTaskComplete).toHaveBeenCalledWith(mockTasks[0]);
    });
  });

  describe('Notification Badges', () => {
    it('shows notification badge for high priority tasks', () => {
      renderWithContext(<CalendarNotifications />);
      
      const notificationBadge = screen.getByTestId('notification-badge');
      expect(notificationBadge).toBeInTheDocument();
    });

    it('hides notification badge when no important tasks', () => {
      const lowPriorityContext = {
        ...mockCalendarContext,
        allTasks: [{ ...mockTasks[0], priority: 'low' }]
      };
      dateUtils.isTaskDueToday.mockReturnValue(true);
      
      renderWithContext(<CalendarNotifications />, lowPriorityContext);
      
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });

    it('shows correct count in notification badge', () => {
      const multipleHighPriorityContext = {
        ...mockCalendarContext,
        allTasks: [
          { ...mockTasks[0], priority: 'high' },
          { ...mockTasks[1], priority: 'high' }
        ]
      };
      dateUtils.isTaskDueToday.mockReturnValue(true);
      dateUtils.isTaskOverdue.mockReturnValue(true);
      
      renderWithContext(<CalendarNotifications />, multipleHighPriorityContext);
      
      const notificationBadge = screen.getByTestId('notification-badge');
      expect(notificationBadge).toHaveTextContent('2');
    });
  });

  describe('Animation and Transitions', () => {
    it('animates task list expansion', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarNotifications />);
      
      const todaySection = screen.getByText(/task due today/i);
      await user.click(todaySection);
      
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toHaveClass('animate-slideDown');
    });

    it('animates notification badge appearance', () => {
      renderWithContext(<CalendarNotifications />);
      
      const notificationBadge = screen.getByTestId('notification-badge');
      expect(notificationBadge).toHaveClass('animate-bounce');
    });

    it('fades in overdue tasks with delay', () => {
      renderWithContext(<CalendarNotifications />);
      
      const overdueTask = screen.getByText('Overdue Task');
      expect(overdueTask.closest('div')).toHaveClass('animate-fadeIn');
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderWithContext(<CalendarNotifications />);
      
      const container = screen.getByTestId('notifications-container');
      expect(container).toHaveClass('flex-col');
    });

    it('shows compact view on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      
      renderWithContext(<CalendarNotifications compact />);
      
      const compactView = screen.getByTestId('compact-notifications');
      expect(compactView).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('memoizes task calculations', () => {
      const { rerender } = renderWithContext(<CalendarNotifications />);
      
      // First render
      expect(dateUtils.isTaskDueToday).toHaveBeenCalledTimes(3);
      
      // Rerender with same props
      rerender(
        <CalendarProvider value={mockCalendarContext}>
          <CalendarNotifications />
        </CalendarProvider>
      );
      
      // Should not recalculate
      expect(dateUtils.isTaskDueToday).toHaveBeenCalledTimes(3);
    });

    it('only updates when tasks change', () => {
      const { rerender } = renderWithContext(<CalendarNotifications />);
      
      const initialCallCount = dateUtils.isTaskDueToday.mock.calls.length;
      
      // Rerender with same tasks
      rerender(
        <CalendarProvider value={mockCalendarContext}>
          <CalendarNotifications />
        </CalendarProvider>
      );
      
      expect(dateUtils.isTaskDueToday).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for sections', () => {
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByRole('region', { name: /today.* tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /overdue tasks/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarNotifications />);
      
      const todaySection = screen.getByText(/task due today/i);
      todaySection.focus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByText('Today Task')).toBeVisible();
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).toHaveTextContent('Today Task');
    });

    it('announces task count changes', () => {
      renderWithContext(<CalendarNotifications />);
      
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/1 task due today, 1 overdue/i);
    });

    it('provides screen reader descriptions for visual indicators', () => {
      renderWithContext(<CalendarNotifications />);
      
      const todayIndicator = screen.getByTestId('today-indicator');
      expect(todayIndicator).toHaveAttribute('aria-label', 'Today');
      
      const priorityIndicator = screen.getByText('high');
      expect(priorityIndicator).toHaveAttribute('aria-label', 'High priority');
    });

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });
      
      renderWithContext(<CalendarNotifications />);
      
      const container = screen.getByTestId('notifications-container');
      expect(container).toHaveClass('high-contrast');
    });
  });

  describe('Error Handling', () => {
    it('handles missing task data gracefully', () => {
      const incompleteTaskContext = {
        ...mockCalendarContext,
        allTasks: [{ _id: '1', title: 'Incomplete Task' }] // Missing required fields
      };
      
      expect(() => {
        renderWithContext(<CalendarNotifications />, incompleteTaskContext);
      }).not.toThrow();
    });

    it('shows fallback when dateUtils fails', () => {
      dateUtils.isTaskDueToday.mockImplementation(() => {
        throw new Error('Date calculation failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderWithContext(<CalendarNotifications />);
      
      expect(screen.getByText(/unable to load task information/i)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('recovers from render errors', () => {
      const ErrorBoundary = ({ children }) => {
        try {
          return children;
        } catch (error) {
          return <div>Error loading notifications</div>;
        }
      };
      
      const ThrowingComponent = () => {
        throw new Error('Render error');
      };
      
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Error loading notifications')).toBeInTheDocument();
    });
  });
});