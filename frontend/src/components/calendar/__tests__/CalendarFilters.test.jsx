import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarProvider } from '../../../context/CalendarContext';
import CalendarFilters from '../CalendarFilters';

// Mock data
const mockTasks = [
  {
    _id: '1',
    title: 'High Priority Task',
    priority: 'high',
    status: 'pending',
    tags: ['work', 'urgent'],
    due: new Date('2024-01-15T10:00:00Z'),
    assignee: 'john'
  },
  {
    _id: '2',
    title: 'Medium Priority Task',
    priority: 'medium',
    status: 'in-progress',
    tags: ['personal'],
    due: new Date('2024-01-16T14:00:00Z'),
    assignee: 'jane'
  },
  {
    _id: '3',
    title: 'Low Priority Task',
    priority: 'low',
    status: 'completed',
    tags: ['work', 'review'],
    due: new Date('2024-01-17T09:00:00Z'),
    assignee: 'john'
  }
];

const mockCalendarContext = {
  allTasks: mockTasks,
  filteredTasks: mockTasks,
  filters: {},
  setFilters: jest.fn(),
  currentDate: new Date('2024-01-15'),
  currentView: 'month'
};

const renderWithContext = (component, contextValue = mockCalendarContext) => {
  return render(
    <CalendarProvider value={contextValue}>
      {component}
    </CalendarProvider>
  );
};

describe('CalendarFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Panel Rendering', () => {
    it('renders filter toggle button', () => {
      renderWithContext(<CalendarFilters />);
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('shows filter panel when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      expect(screen.getByText('Filter Tasks')).toBeInTheDocument();
    });

    it('hides filter panel when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      // Open panel
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      // Close panel
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(screen.queryByText('Filter Tasks')).not.toBeInTheDocument();
    });
  });

  describe('Priority Filtering', () => {
    it('renders priority filter options', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      expect(screen.getByLabelText(/high priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/medium priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/low priority/i)).toBeInTheDocument();
    });

    it('applies priority filter when checkbox is selected', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        setFilters: mockSetFilters
      };
      
      renderWithContext(<CalendarFilters />, contextValue);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const highPriorityCheckbox = screen.getByLabelText(/high priority/i);
      await user.click(highPriorityCheckbox);
      
      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: ['high']
        })
      );
    });

    it('removes priority filter when checkbox is deselected', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        filters: { priority: ['high'] },
        setFilters: mockSetFilters
      };
      
      renderWithContext(<CalendarFilters />, contextValue);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const highPriorityCheckbox = screen.getByLabelText(/high priority/i);
      await user.click(highPriorityCheckbox);
      
      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: []
        })
      );
    });
  });

  describe('Status Filtering', () => {
    it('renders status filter options', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      expect(screen.getByLabelText(/pending/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/in progress/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/completed/i)).toBeInTheDocument();
    });

    it('applies status filter correctly', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        setFilters: mockSetFilters
      };
      
      renderWithContext(<CalendarFilters />, contextValue);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const pendingCheckbox = screen.getByLabelText(/pending/i);
      await user.click(pendingCheckbox);
      
      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['pending']
        })
      );
    });
  });

  describe('Tag Filtering', () => {
    it('renders tag filter section', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('shows available tags from tasks', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('personal')).toBeInTheDocument();
      expect(screen.getByText('review')).toBeInTheDocument();
    });

    it('applies tag filter when tag is selected', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        setFilters: mockSetFilters
      };
      
      renderWithContext(<CalendarFilters />, contextValue);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const workTag = screen.getByText('work');
      await user.click(workTag);
      
      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['work']
        })
      );
    });
  });

  describe('Assignee Filtering', () => {
    it('renders assignee filter section', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      expect(screen.getByText('Assignee')).toBeInTheDocument();
    });

    it('shows available assignees from tasks', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      expect(screen.getByText('john')).toBeInTheDocument();
      expect(screen.getByText('jane')).toBeInTheDocument();
    });

    it('applies assignee filter correctly', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        setFilters: mockSetFilters
      };
      
      renderWithContext(<CalendarFilters />, contextValue);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const johnAssignee = screen.getByText('john');
      await user.click(johnAssignee);
      
      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          assignee: ['john']
        })
      );
    });
  });

  describe('Date Range Filtering', () => {
    it('renders date range filter section', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    it('applies date range filter when dates are selected', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        setFilters: mockSetFilters
      };
      
      renderWithContext(<CalendarFilters />, contextValue);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '2024-01-15');
      
      const endDateInput = screen.getByLabelText(/end date/i);
      await user.type(endDateInput, '2024-01-17');
      
      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: {
            start: expect.any(Date),
            end: expect.any(Date)
          }
        })
      );
    });
  });

  describe('Filter Actions', () => {
    it('clears all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        filters: { priority: ['high'], status: ['pending'] },
        setFilters: mockSetFilters
      };
      
      renderWithContext(<CalendarFilters />, contextValue);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);
      
      expect(mockSetFilters).toHaveBeenCalledWith({});
    });

    it('shows active filter count', () => {
      const contextValue = {
        ...mockCalendarContext,
        filters: { priority: ['high'], status: ['pending'] }
      };
      
      renderWithContext(<CalendarFilters />, contextValue);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('saves filter preset when save button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSavePreset = jest.fn();
      
      renderWithContext(
        <CalendarFilters onSavePreset={mockOnSavePreset} />,
        {
          ...mockCalendarContext,
          filters: { priority: ['high'] }
        }
      );
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const saveButton = screen.getByRole('button', { name: /save preset/i });
      await user.click(saveButton);
      
      expect(mockOnSavePreset).toHaveBeenCalledWith({ priority: ['high'] });
    });
  });

  describe('Filter Persistence', () => {
    it('loads saved filters from localStorage', () => {
      const savedFilters = { priority: ['high'], status: ['pending'] };
      localStorage.setItem('calendar-filters', JSON.stringify(savedFilters));
      
      renderWithContext(<CalendarFilters />);
      
      expect(mockCalendarContext.setFilters).toHaveBeenCalledWith(savedFilters);
    });

    it('saves filters to localStorage when filters change', async () => {
      const user = userEvent.setup();
      const mockSetFilters = jest.fn();
      
      renderWithContext(<CalendarFilters />, {
        ...mockCalendarContext,
        setFilters: mockSetFilters
      });
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const highPriorityCheckbox = screen.getByLabelText(/high priority/i);
      await user.click(highPriorityCheckbox);
      
      await waitFor(() => {
        const savedFilters = JSON.parse(localStorage.getItem('calendar-filters') || '{}');
        expect(savedFilters).toEqual(expect.objectContaining({
          priority: ['high']
        }));
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for filter controls', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      expect(screen.getByRole('region', { name: /filter panel/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /priority filters/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /status filters/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      
      // Focus and activate with keyboard
      toggleButton.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Filter Tasks')).toBeInTheDocument();
      
      // Navigate with Tab
      await user.keyboard('{Tab}');
      expect(document.activeElement).toHaveAttribute('type', 'checkbox');
    });

    it('announces filter changes to screen readers', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarFilters />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      await user.click(toggleButton);
      
      const highPriorityCheckbox = screen.getByLabelText(/high priority/i);
      await user.click(highPriorityCheckbox);
      
      expect(screen.getByRole('status')).toHaveTextContent(/1 filter applied/i);
    });
  });
});