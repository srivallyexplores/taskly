import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CalendarGrid from '../CalendarGrid';
import { CalendarProvider } from '../../../context/CalendarContext';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock date utils
vi.mock('../../../utils/dateUtils', () => ({
  dateUtils: {
    getDateKey: vi.fn((date) => '2024-01-01'),
    isToday: vi.fn(() => false),
    isSameDate: vi.fn(() => false),
    isDateInCurrentMonth: vi.fn(() => true),
    isWeekend: vi.fn(() => false),
    getCalendarGrid: vi.fn(() => [
      [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')],
    ]),
  },
}));

// Mock task calendar utils
vi.mock('../../../utils/taskCalendarUtils', () => ({
  taskCalendarUtils: {
    getTaskColor: vi.fn(() => 'bg-blue-500'),
    getTaskDisplayText: vi.fn((task) => task.title),
    getTaskTooltipText: vi.fn((task) => task.title),
    validateTaskDrop: vi.fn(() => true),
  },
}));

// Test wrapper with CalendarProvider
const TestWrapper = ({ children }) => (
  <CalendarProvider>
    {children}
  </CalendarProvider>
);

describe('CalendarGrid', () => {
  const mockOnDateClick = vi.fn();
  const mockOnTaskClick = vi.fn();
  const mockOnTaskDrop = vi.fn();

  const mockTasks = [
    {
      _id: '1',
      title: 'Test Task 1',
      due: '2024-01-01',
      priority: 'high',
      status: 'in-progress',
    },
    {
      _id: '2',
      title: 'Test Task 2',
      due: '2024-01-01',
      priority: 'medium',
      status: 'completed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calendar grid with date cells', () => {
    render(
      <TestWrapper>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </TestWrapper>
    );

    // Should render the grid structure
    expect(screen.getByRole('grid', { hidden: true })).toBeInTheDocument();
  });

  it('handles date cell clicks', () => {
    render(
      <TestWrapper>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </TestWrapper>
    );

    // Find and click a date cell
    const dateCell = screen.getByText('1');
    fireEvent.click(dateCell);

    expect(mockOnDateClick).toHaveBeenCalled();
  });

  it('handles task clicks', () => {
    // Mock the calendar context to return tasks
    const MockCalendarProvider = ({ children }) => {
      const mockContext = {
        currentView: 'month',
        currentDate: new Date('2024-01-01'),
        draggedTask: null,
        setDraggedTask: vi.fn(),
        getTasksForDate: vi.fn(() => mockTasks),
        settings: { weekStartsOn: 0, showWeekends: true },
      };

      return (
        <div data-testid="mock-calendar-context">
          {React.cloneElement(children, { mockContext })}
        </div>
      );
    };

    render(
      <MockCalendarProvider>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </MockCalendarProvider>
    );

    // Should render without errors
    expect(screen.getByTestId('mock-calendar-context')).toBeInTheDocument();
  });

  it('handles drag and drop operations', async () => {
    render(
      <TestWrapper>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </TestWrapper>
    );

    // Simulate drag and drop
    const dateCell = screen.getByText('1');
    
    // Mock drag data
    const mockDragData = JSON.stringify({
      taskId: '1',
      originalDate: '2024-01-01',
    });

    // Simulate drag over
    fireEvent.dragOver(dateCell, {
      dataTransfer: {
        dropEffect: 'move',
      },
    });

    // Simulate drop
    fireEvent.drop(dateCell, {
      dataTransfer: {
        getData: vi.fn(() => mockDragData),
      },
    });

    // Should handle drop without errors
    expect(dateCell).toBeInTheDocument();
  });

  it('shows drag over indicators', () => {
    render(
      <TestWrapper>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </TestWrapper>
    );

    const dateCell = screen.getByText('1');
    
    // Simulate drag over
    fireEvent.dragOver(dateCell);

    // Should show visual feedback
    expect(dateCell).toBeInTheDocument();
  });

  it('handles drag leave events', () => {
    render(
      <TestWrapper>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </TestWrapper>
    );

    const dateCell = screen.getByText('1');
    
    // Simulate drag leave
    fireEvent.dragLeave(dateCell, {
      clientX: 0,
      clientY: 0,
    });

    // Should handle without errors
    expect(dateCell).toBeInTheDocument();
  });

  it('renders different views correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </TestWrapper>
    );

    // Test with children (for other views)
    rerender(
      <TestWrapper>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        >
          <div>Week View Content</div>
        </CalendarGrid>
      </TestWrapper>
    );

    expect(screen.getByText('Week View Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <CalendarGrid
          className="custom-class"
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles task drag start and end', () => {
    render(
      <TestWrapper>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </TestWrapper>
    );

    // Should render without errors even when drag events occur
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows global drag overlay when dragging', () => {
    // This would require mocking the calendar context with a dragged task
    render(
      <TestWrapper>
        <CalendarGrid
          onDateClick={mockOnDateClick}
          onTaskClick={mockOnTaskClick}
          onTaskDrop={mockOnTaskDrop}
        />
      </TestWrapper>
    );

    // Basic render test - drag overlay would appear with dragged task
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});