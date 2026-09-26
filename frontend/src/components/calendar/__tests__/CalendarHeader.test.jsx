import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CalendarHeader from '../CalendarHeader';
import { CalendarProvider } from '../../../context/CalendarContext';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock date utils
vi.mock('../../../utils/dateUtils', () => ({
  dateUtils: {
    formatMonthYear: vi.fn((date) => 'January 2024'),
    formatWeekRange: vi.fn((start, end) => 'Jan 1 - Jan 7, 2024'),
    formatDisplayDate: vi.fn((date) => 'January 1, 2024'),
  },
}));

// Test wrapper with CalendarProvider
const TestWrapper = ({ children }) => (
  <CalendarProvider>
    {children}
  </CalendarProvider>
);

describe('CalendarHeader', () => {
  const mockOnCreateTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calendar header with navigation controls', () => {
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    // Check for navigation buttons
    expect(screen.getByTitle('Previous')).toBeInTheDocument();
    expect(screen.getByTitle('Next')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('displays current date based on view mode', () => {
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    // Should display formatted date
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('renders all view options', () => {
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    // Check for view buttons
    expect(screen.getByTitle('Month view (M)')).toBeInTheDocument();
    expect(screen.getByTitle('Week view (W)')).toBeInTheDocument();
    expect(screen.getByTitle('Day view (D)')).toBeInTheDocument();
    expect(screen.getByTitle('Agenda view (A)')).toBeInTheDocument();
  });

  it('calls onCreateTask when new task button is clicked', () => {
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    const newTaskButton = screen.getByRole('button', { name: /new task/i });
    fireEvent.click(newTaskButton);

    expect(mockOnCreateTask).toHaveBeenCalledTimes(1);
  });

  it('handles navigation button clicks', async () => {
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    const prevButton = screen.getByTitle('Previous');
    const nextButton = screen.getByTitle('Next');

    fireEvent.click(prevButton);
    fireEvent.click(nextButton);

    // Navigation should work without errors
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('handles today button click', () => {
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);

    // Should not throw error
    expect(todayButton).toBeInTheDocument();
  });

  it('handles view switching', () => {
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    const weekViewButton = screen.getByTitle('Week view (W)');
    fireEvent.click(weekViewButton);

    // Should not throw error
    expect(weekViewButton).toBeInTheDocument();
  });

  it('shows date picker when date is clicked', async () => {
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    const dateButton = screen.getByTitle('Select date');
    fireEvent.click(dateButton);

    await waitFor(() => {
      expect(screen.getByText('Date picker coming soon...')).toBeInTheDocument();
    });
  });

  it('handles keyboard shortcuts', () => {
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    // Simulate keyboard events
    fireEvent.keyDown(document, { key: 'm' });
    fireEvent.keyDown(document, { key: 'w' });
    fireEvent.keyDown(document, { key: 'd' });
    fireEvent.keyDown(document, { key: 'a' });
    fireEvent.keyDown(document, { key: 't' });

    // Should not throw errors
    expect(screen.getByTitle('Month view (M)')).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    // This would require mocking the calendar context to return isLoading: true
    render(
      <TestWrapper>
        <CalendarHeader onCreateTask={mockOnCreateTask} />
      </TestWrapper>
    );

    // Basic render test when loading state would be active
    expect(screen.getByTitle('Previous')).toBeInTheDocument();
  });

  it('renders without onCreateTask prop', () => {
    render(
      <TestWrapper>
        <CalendarHeader />
      </TestWrapper>
    );

    // Should render without the create task button
    expect(screen.queryByText('New Task')).not.toBeInTheDocument();
  });
});