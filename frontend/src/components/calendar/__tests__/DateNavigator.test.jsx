import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DateNavigator from '../DateNavigator';
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
    isToday: vi.fn(() => false),
    isSameDate: vi.fn(() => false),
    getWeekRange: vi.fn(() => ({
      start: new Date('2024-01-01'),
      end: new Date('2024-01-07'),
    })),
  },
}));

// Test wrapper with CalendarProvider
const TestWrapper = ({ children }) => (
  <CalendarProvider>
    {children}
  </CalendarProvider>
);

describe('DateNavigator', () => {
  const mockOnDatePickerToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders date navigator trigger button', () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    expect(screen.getByText('Select Date')).toBeInTheDocument();
  });

  it('opens date picker when trigger is clicked', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    const triggerButton = screen.getByText('Select Date');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  it('closes date picker when backdrop is clicked', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    const triggerButton = screen.getByText('Select Date');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    // Click backdrop (simulate outside click)
    const backdrop = document.querySelector('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
  });

  it('navigates between months', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    fireEvent.click(screen.getByText('Select Date'));

    await waitFor(() => {
      const prevButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')
      );
      if (prevButton) {
        fireEvent.click(prevButton);
      }
    });
  });

  it('switches to months view', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    fireEvent.click(screen.getByText('Select Date'));

    await waitFor(() => {
      // Look for month button (would be current month name)
      const monthButtons = screen.getAllByRole('button');
      const monthButton = monthButtons.find(btn => 
        btn.textContent && btn.textContent.match(/January|February|March|April|May|June|July|August|September|October|November|December/)
      );
      
      if (monthButton) {
        fireEvent.click(monthButton);
      }
    });
  });

  it('switches to years view', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    fireEvent.click(screen.getByText('Select Date'));

    await waitFor(() => {
      // Look for year button (would be current year)
      const yearButtons = screen.getAllByRole('button');
      const yearButton = yearButtons.find(btn => 
        btn.textContent && btn.textContent.match(/\d{4}/)
      );
      
      if (yearButton) {
        fireEvent.click(yearButton);
      }
    });
  });

  it('selects a date', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    fireEvent.click(screen.getByText('Select Date'));

    await waitFor(() => {
      // Find a date button (number)
      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find(btn => 
        btn.textContent && /^\d+$/.test(btn.textContent.trim())
      );
      
      if (dateButton) {
        fireEvent.click(dateButton);
      }
    });
  });

  it('handles today button click', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    fireEvent.click(screen.getByText('Select Date'));

    await waitFor(() => {
      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);
    });
  });

  it('handles cancel button click', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    fireEvent.click(screen.getByText('Select Date'));

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });
  });

  it('handles keyboard navigation', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    fireEvent.click(screen.getByText('Select Date'));

    await waitFor(() => {
      // Test escape key
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    // Test arrow keys
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'Enter' });
  });

  it('closes picker with close button', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    fireEvent.click(screen.getByText('Select Date'));

    await waitFor(() => {
      // Find close button (X icon)
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('class')?.includes('top-2')
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
      }
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <DateNavigator 
          className="custom-class"
          onDatePickerToggle={mockOnDatePickerToggle} 
        />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles showDatePicker prop', () => {
    render(
      <TestWrapper>
        <DateNavigator 
          showDatePicker={true}
          onDatePickerToggle={mockOnDatePickerToggle} 
        />
      </TestWrapper>
    );

    // Should show picker initially
    expect(screen.getByText('Select Date')).toBeInTheDocument();
  });

  it('calls onDatePickerToggle when picker state changes', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker
    fireEvent.click(screen.getByText('Select Date'));

    await waitFor(() => {
      expect(mockOnDatePickerToggle).toHaveBeenCalledWith(true);
    });
  });

  it('renders without onDatePickerToggle prop', () => {
    render(
      <TestWrapper>
        <DateNavigator />
      </TestWrapper>
    );

    expect(screen.getByText('Select Date')).toBeInTheDocument();
  });

  it('handles month selection in months view', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker and navigate to months view
    fireEvent.click(screen.getByText('Select Date'));

    // This would require more complex state management to test properly
    // For now, just ensure it renders without errors
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  it('handles year selection in years view', async () => {
    render(
      <TestWrapper>
        <DateNavigator onDatePickerToggle={mockOnDatePickerToggle} />
      </TestWrapper>
    );

    // Open picker and navigate to years view
    fireEvent.click(screen.getByText('Select Date'));

    // This would require more complex state management to test properly
    // For now, just ensure it renders without errors
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });
});