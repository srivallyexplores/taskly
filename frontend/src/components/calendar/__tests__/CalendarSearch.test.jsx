import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarProvider } from '../../../context/CalendarContext';
import CalendarSearch from '../CalendarSearch';

// Mock data
const mockTasks = [
  {
    _id: '1',
    title: 'Meeting with client about project proposal',
    description: 'Discuss requirements and timeline',
    priority: 'high',
    status: 'pending',
    tags: ['work', 'meeting', 'client'],
    due: new Date('2024-01-15T10:00:00Z'),
    assignee: 'john'
  },
  {
    _id: '2',
    title: 'Review code changes',
    description: 'Check pull request for security issues',
    priority: 'medium',
    status: 'in-progress',
    tags: ['development', 'review'],
    due: new Date('2024-01-16T14:00:00Z'),
    assignee: 'jane'
  },
  {
    _id: '3',
    title: 'Update documentation',
    description: 'Add new API endpoints to docs',
    priority: 'low',
    status: 'completed',
    tags: ['documentation', 'api'],
    due: new Date('2024-01-17T09:00:00Z'),
    assignee: 'john'
  }
];

const mockCalendarContext = {
  allTasks: mockTasks,
  filteredTasks: mockTasks,
  searchQuery: '',
  setSearchQuery: jest.fn(),
  searchResults: [],
  setSearchResults: jest.fn(),
  currentDate: new Date('2024-01-15'),
  currentView: 'month',
  setSelectedDate: jest.fn()
};

const renderWithContext = (component, contextValue = mockCalendarContext) => {
  return render(
    <CalendarProvider value={contextValue}>
      {component}
    </CalendarProvider>
  );
};

describe('CalendarSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Input Rendering', () => {
    it('renders search input field', () => {
      renderWithContext(<CalendarSearch />);
      expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
    });

    it('renders search icon', () => {
      renderWithContext(<CalendarSearch />);
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('shows clear button when there is search text', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'meeting');
      
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('updates search query when typing', async () => {
      const user = userEvent.setup();
      const mockSetSearchQuery = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        setSearchQuery: mockSetSearchQuery
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'meeting');
      
      expect(mockSetSearchQuery).toHaveBeenCalledWith('meeting');
    });

    it('performs search on input change with debounce', async () => {
      const user = userEvent.setup();
      const mockSetSearchResults = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        setSearchResults: mockSetSearchResults
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'meeting');
      
      // Wait for debounce
      await waitFor(() => {
        expect(mockSetSearchResults).toHaveBeenCalledWith([
          expect.objectContaining({
            _id: '1',
            title: 'Meeting with client about project proposal'
          })
        ]);
      }, { timeout: 1000 });
    });

    it('searches in task titles', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'review');
      
      await waitFor(() => {
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
      });
    });

    it('searches in task descriptions', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'security');
      
      await waitFor(() => {
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
      });
    });

    it('searches in task tags', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'client');
      
      await waitFor(() => {
        expect(screen.getByText('Meeting with client about project proposal')).toBeInTheDocument();
      });
    });

    it('performs case-insensitive search', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'MEETING');
      
      await waitFor(() => {
        expect(screen.getByText('Meeting with client about project proposal')).toBeInTheDocument();
      });
    });
  });

  describe('Search Results Display', () => {
    it('shows search results when query is entered', async () => {
      const user = userEvent.setup();
      const contextValue = {
        ...mockCalendarContext,
        searchQuery: 'meeting',
        searchResults: [mockTasks[0]]
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      expect(screen.getByText('Search Results')).toBeInTheDocument();
      expect(screen.getByText('Meeting with client about project proposal')).toBeInTheDocument();
    });

    it('shows no results message when no matches found', async () => {
      const user = userEvent.setup();
      const contextValue = {
        ...mockCalendarContext,
        searchQuery: 'nonexistent',
        searchResults: []
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
    });

    it('highlights search terms in results', async () => {
      const user = userEvent.setup();
      const contextValue = {
        ...mockCalendarContext,
        searchQuery: 'meeting',
        searchResults: [mockTasks[0]]
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      const highlightedText = screen.getByText('meeting');
      expect(highlightedText).toHaveClass('bg-yellow-200');
    });

    it('shows task metadata in search results', async () => {
      const user = userEvent.setup();
      const contextValue = {
        ...mockCalendarContext,
        searchQuery: 'meeting',
        searchResults: [mockTasks[0]]
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('john')).toBeInTheDocument();
    });

    it('navigates to task date when result is clicked', async () => {
      const user = userEvent.setup();
      const mockSetSelectedDate = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        searchQuery: 'meeting',
        searchResults: [mockTasks[0]],
        setSelectedDate: mockSetSelectedDate
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      const taskResult = screen.getByText('Meeting with client about project proposal');
      await user.click(taskResult);
      
      expect(mockSetSelectedDate).toHaveBeenCalledWith(new Date('2024-01-15T10:00:00Z'));
    });
  });

  describe('Advanced Search Features', () => {
    it('supports search operators', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'priority:high');
      
      await waitFor(() => {
        expect(screen.getByText('Meeting with client about project proposal')).toBeInTheDocument();
        expect(screen.queryByText('Review code changes')).not.toBeInTheDocument();
      });
    });

    it('supports tag search with #', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, '#work');
      
      await waitFor(() => {
        expect(screen.getByText('Meeting with client about project proposal')).toBeInTheDocument();
      });
    });

    it('supports assignee search with @', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, '@john');
      
      await waitFor(() => {
        expect(screen.getByText('Meeting with client about project proposal')).toBeInTheDocument();
        expect(screen.getByText('Update documentation')).toBeInTheDocument();
        expect(screen.queryByText('Review code changes')).not.toBeInTheDocument();
      });
    });

    it('supports date range search', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'due:2024-01-15');
      
      await waitFor(() => {
        expect(screen.getByText('Meeting with client about project proposal')).toBeInTheDocument();
        expect(screen.queryByText('Review code changes')).not.toBeInTheDocument();
      });
    });

    it('supports status search', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'status:completed');
      
      await waitFor(() => {
        expect(screen.getByText('Update documentation')).toBeInTheDocument();
        expect(screen.queryByText('Meeting with client about project proposal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search History', () => {
    it('saves search queries to history', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'meeting');
      await user.keyboard('{Enter}');
      
      const savedHistory = JSON.parse(localStorage.getItem('calendar-search-history') || '[]');
      expect(savedHistory).toContain('meeting');
    });

    it('shows search history dropdown', async () => {
      const user = userEvent.setup();
      localStorage.setItem('calendar-search-history', JSON.stringify(['meeting', 'review']));
      
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.click(searchInput);
      
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('meeting')).toBeInTheDocument();
      expect(screen.getByText('review')).toBeInTheDocument();
    });

    it('selects search from history', async () => {
      const user = userEvent.setup();
      const mockSetSearchQuery = jest.fn();
      localStorage.setItem('calendar-search-history', JSON.stringify(['meeting']));
      
      renderWithContext(<CalendarSearch />, {
        ...mockCalendarContext,
        setSearchQuery: mockSetSearchQuery
      });
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.click(searchInput);
      
      const historyItem = screen.getByText('meeting');
      await user.click(historyItem);
      
      expect(mockSetSearchQuery).toHaveBeenCalledWith('meeting');
    });
  });

  describe('Search Shortcuts', () => {
    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      const mockSetSearchQuery = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        searchQuery: 'meeting',
        setSearchQuery: mockSetSearchQuery
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);
      
      expect(mockSetSearchQuery).toHaveBeenCalledWith('');
    });

    it('supports keyboard shortcuts', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      // Focus search with Ctrl+F
      await user.keyboard('{Control>}f{/Control}');
      
      expect(document.activeElement).toBe(screen.getByPlaceholderText(/search tasks/i));
    });

    it('closes search results with Escape', async () => {
      const user = userEvent.setup();
      const contextValue = {
        ...mockCalendarContext,
        searchQuery: 'meeting',
        searchResults: [mockTasks[0]]
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      searchInput.focus();
      await user.keyboard('{Escape}');
      
      expect(screen.queryByText('Search Results')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('debounces search input to avoid excessive API calls', async () => {
      const user = userEvent.setup();
      const mockSetSearchResults = jest.fn();
      const contextValue = {
        ...mockCalendarContext,
        setSearchResults: mockSetSearchResults
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      
      // Type quickly
      await user.type(searchInput, 'meeting', { delay: 50 });
      
      // Should only call search once after debounce
      await waitFor(() => {
        expect(mockSetSearchResults).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    it('cancels previous search when new search is initiated', async () => {
      const user = userEvent.setup();
      renderWithContext(<CalendarSearch />);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      
      // Start first search
      await user.type(searchInput, 'meeting');
      
      // Immediately start second search
      await user.clear(searchInput);
      await user.type(searchInput, 'review');
      
      // Should only show results for the latest search
      await waitFor(() => {
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
        expect(screen.queryByText('Meeting with client about project proposal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithContext(<CalendarSearch />);
      
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Search tasks');
      expect(screen.getByRole('button', { name: /search/i })).toHaveAttribute('aria-label', 'Search');
    });

    it('announces search results to screen readers', async () => {
      const user = userEvent.setup();
      const contextValue = {
        ...mockCalendarContext,
        searchQuery: 'meeting',
        searchResults: [mockTasks[0]]
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      expect(screen.getByRole('status')).toHaveTextContent(/1 result found/i);
    });

    it('supports keyboard navigation in search results', async () => {
      const user = userEvent.setup();
      const contextValue = {
        ...mockCalendarContext,
        searchQuery: 'meeting',
        searchResults: [mockTasks[0]]
      };
      
      renderWithContext(<CalendarSearch />, contextValue);
      
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      searchInput.focus();
      
      // Navigate to first result with arrow key
      await user.keyboard('{ArrowDown}');
      
      expect(screen.getByText('Meeting with client about project proposal')).toHaveClass('bg-primary-100');
    });
  });
});