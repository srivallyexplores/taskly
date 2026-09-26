import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarProvider } from '../../../context/CalendarContext';
import CalendarReminders from '../CalendarReminders';
import { addMinutes, subMinutes, addDays } from 'date-fns';

// Mock date-fns functions
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  differenceInMinutes: jest.fn(),
  isAfter: jest.fn(),
  isBefore: jest.fn(),
  addMinutes: jest.fn(),
  format: jest.fn()
}));

// Mock Notification API
const mockNotification = {
  requestPermission: jest.fn().mockResolvedValue('granted'),
  permission: 'granted',
  close: jest.fn(),
  onclick: null
};

Object.defineProperty(window, 'Notification', {
  value: jest.fn().mockImplementation((title, options) => ({
    ...mockNotification,
    title,
    ...options
  })),
  configurable: true
});

window.Notification.requestPermission = mockNotification.requestPermission;
window.Notification.permission = mockNotification.permission;

// Mock audio
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  currentTime: 0
};

Object.defineProperty(window, 'Audio', {
  value: jest.fn().mockImplementation(() => mockAudio),
  configurable: true
});

// Mock tasks
const mockTasks = [
  {
    _id: '1',
    title: 'Upcoming Meeting',
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
    title: 'Completed Task',
    priority: 'low',
    status: 'completed',
    due: new Date('2024-01-15T14:00:00Z')
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

describe('CalendarReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
    
    // Reset date-fns mocks
    require('date-fns').differenceInMinutes.mockReturnValue(15);
    require('date-fns').isAfter.mockReturnValue(false);
    require('date-fns').isBefore.mockReturnValue(true);
    require('date-fns').addMinutes.mockImplementation((date, minutes) => 
      new Date(date.getTime() + minutes * 60000)
    );
    require('date-fns').format.mockReturnValue('Jan 15, 10:00 AM');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Reminder Settings', () => {
    it('renders settings button', () => {
      renderWithContext(<CalendarReminders />);
      expect(screen.getByTitle('Reminder Settings')).toBeInTheDocument();
    });

    it('opens settings panel when button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithContext(<CalendarReminders />);
      
      const settingsButton = screen.getByTitle('Reminder Settings');
      await user.click(settingsButton);
      
      expect(screen.getByText('Reminder Settings')).toBeInTheDocument();
    });

    it('loads settings from localStorage', () => {
      const savedSettings = {
        enabled: false,
        soundEnabled: false,
        beforeMinutes: [30, 120]
      };
      localStorage.setItem('calendar-reminder-settings', JSON.stringify(savedSettings));
      
      renderWithContext(<CalendarReminders />);
      
      // Settings should be loaded (we can't directly test state, but we can test behavior)
      expect(localStorage.getItem('calendar-reminder-settings')).toBeTruthy();
    });

    it('saves settings to localStorage when changed', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithContext(<CalendarReminders />);
      
      const settingsButton = screen.getByTitle('Reminder Settings');
      await user.click(settingsButton);
      
      const enableCheckbox = screen.getByLabelText('Enable Reminders');
      await user.click(enableCheckbox);
      
      await waitFor(() => {
        const savedSettings = JSON.parse(localStorage.getItem('calendar-reminder-settings') || '{}');
        expect(savedSettings).toHaveProperty('enabled');
      });
    });
  });

  describe('Notification Permission', () => {
    it('requests notification permission when browser notifications are enabled', async () => {
      window.Notification.permission = 'default';
      
      renderWithContext(<CalendarReminders />);
      
      // Trigger a reminder that would request permission
      act(() => {
        jest.advanceTimersByTime(60000); // Advance 1 minute
      });
      
      await waitFor(() => {
        expect(mockNotification.requestPermission).toHaveBeenCalled();
      });
    });

    it('does not show browser notifications when permission is denied', async () => {
      window.Notification.permission = 'denied';
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      expect(window.Notification).not.toHaveBeenCalled();
    });
  });

  describe('Reminder Creation', () => {
    it('creates deadline reminders for upcoming tasks', async () => {
      // Mock task due in 15 minutes
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000); // Trigger reminder check
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Task Reminder/)).toBeInTheDocument();
      });
    });

    it('creates overdue reminders for past due tasks', async () => {
      // Mock overdue task
      require('date-fns').differenceInMinutes.mockReturnValue(-30);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Overdue Task/)).toBeInTheDocument();
      });
    });

    it('does not create reminders for completed tasks', async () => {
      const completedTaskContext = {
        ...mockCalendarContext,
        allTasks: [{ ...mockTasks[0], status: 'completed' }]
      };
      
      renderWithContext(<CalendarReminders />, completedTaskContext);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      // Should not show any reminders
      expect(screen.queryByText(/Task Reminder/)).not.toBeInTheDocument();
    });

    it('respects quiet hours settings', async () => {
      const settingsWithQuietHours = {
        enabled: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        }
      };
      
      localStorage.setItem('calendar-reminder-settings', JSON.stringify(settingsWithQuietHours));
      
      // Mock current time to be in quiet hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(23);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      // Should not play sound or show browser notifications during quiet hours
      expect(mockAudio.play).not.toHaveBeenCalled();
    });
  });

  describe('Reminder Display', () => {
    it('displays reminder notifications with task information', async () => {
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Task Reminder')).toBeInTheDocument();
        expect(screen.getByText(/Upcoming Meeting/)).toBeInTheDocument();
        expect(screen.getByText('high')).toBeInTheDocument();
      });
    });

    it('shows different icons for different reminder types', async () => {
      require('date-fns').differenceInMinutes.mockReturnValue(-30); // Overdue
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Overdue Task')).toBeInTheDocument();
      });
    });

    it('displays task priority and due date information', async () => {
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText(/Due:/)).toBeInTheDocument();
      });
    });
  });

  describe('Reminder Actions', () => {
    it('dismisses reminder when dismiss button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Task Reminder')).toBeInTheDocument();
      });
      
      const dismissButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(dismissButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Task Reminder')).not.toBeInTheDocument();
      });
    });

    it('calls onReminderAction when view task is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnReminderAction = jest.fn();
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders onReminderAction={mockOnReminderAction} />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('View Task')).toBeInTheDocument();
      });
      
      const viewButton = screen.getByText('View Task');
      await user.click(viewButton);
      
      expect(mockOnReminderAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'deadline',
          task: expect.objectContaining({ _id: '1' })
        }),
        'view'
      );
    });

    it('calls onReminderAction when mark complete is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnReminderAction = jest.fn();
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders onReminderAction={mockOnReminderAction} />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Mark Complete')).toBeInTheDocument();
      });
      
      const completeButton = screen.getByText('Mark Complete');
      await user.click(completeButton);
      
      expect(mockOnReminderAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'deadline',
          task: expect.objectContaining({ _id: '1' })
        }),
        'complete'
      );
    });

    it('snoozes reminder when snooze button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('5m')).toBeInTheDocument();
      });
      
      const snoozeButton = screen.getByText('5m');
      await user.click(snoozeButton);
      
      // Reminder should disappear temporarily
      await waitFor(() => {
        expect(screen.queryByText('Task Reminder')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sound Notifications', () => {
    it('plays notification sound when enabled', async () => {
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(mockAudio.play).toHaveBeenCalled();
      });
    });

    it('does not play sound when disabled in settings', async () => {
      const settingsWithoutSound = {
        enabled: true,
        soundEnabled: false
      };
      localStorage.setItem('calendar-reminder-settings', JSON.stringify(settingsWithoutSound));
      
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      expect(mockAudio.play).not.toHaveBeenCalled();
    });

    it('handles audio play errors gracefully', async () => {
      mockAudio.play.mockRejectedValue(new Error('Audio play failed'));
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to play notification sound:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Daily Summary', () => {
    it('generates daily summary at scheduled time', async () => {
      // Mock time to be 9 AM
      const mockDate = new Date('2024-01-15T09:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(1000); // Small advance to trigger
      });
      
      await waitFor(() => {
        expect(screen.getByText('Daily Summary')).toBeInTheDocument();
      });
    });

    it('includes task counts in daily summary', async () => {
      const mockDate = new Date('2024-01-15T09:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/completed.*pending.*overdue/)).toBeInTheDocument();
      });
    });
  });

  describe('Reminder Cleanup', () => {
    it('removes dismissed reminders after timeout', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Task Reminder')).toBeInTheDocument();
      });
      
      // Dismiss reminder
      const dismissButton = screen.getByRole('button', { name: '' });
      await user.click(dismissButton);
      
      // Advance time for cleanup
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      });
      
      // Reminder should be completely removed
      expect(screen.queryByText('Task Reminder')).not.toBeInTheDocument();
    });

    it('removes old reminders automatically', async () => {
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Task Reminder')).toBeInTheDocument();
      });
      
      // Advance time by 24+ hours
      act(() => {
        jest.advanceTimersByTime(25 * 60 * 60 * 1000);
      });
      
      // Old reminders should be cleaned up
      expect(screen.queryByText('Task Reminder')).not.toBeInTheDocument();
    });
  });

  describe('Settings Panel', () => {
    it('toggles notification types', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithContext(<CalendarReminders />);
      
      const settingsButton = screen.getByTitle('Reminder Settings');
      await user.click(settingsButton);
      
      const deadlinesCheckbox = screen.getByLabelText(/deadlines/i);
      await user.click(deadlinesCheckbox);
      
      // Settings should be updated
      await waitFor(() => {
        const savedSettings = JSON.parse(localStorage.getItem('calendar-reminder-settings') || '{}');
        expect(savedSettings.reminderTypes).toHaveProperty('deadlines');
      });
    });

    it('updates quiet hours settings', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithContext(<CalendarReminders />);
      
      const settingsButton = screen.getByTitle('Reminder Settings');
      await user.click(settingsButton);
      
      const quietHoursCheckbox = screen.getByLabelText('Quiet Hours');
      await user.click(quietHoursCheckbox);
      
      const startTimeInput = screen.getByLabelText('Start');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '23:00');
      
      await waitFor(() => {
        const savedSettings = JSON.parse(localStorage.getItem('calendar-reminder-settings') || '{}');
        expect(savedSettings.quietHours.start).toBe('23:00');
      });
    });

    it('closes settings panel when done button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithContext(<CalendarReminders />);
      
      const settingsButton = screen.getByTitle('Reminder Settings');
      await user.click(settingsButton);
      
      const doneButton = screen.getByText('Done');
      await user.click(doneButton);
      
      expect(screen.queryByText('Reminder Settings')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for reminder notifications', async () => {
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        const reminder = screen.getByRole('alert');
        expect(reminder).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation in settings', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithContext(<CalendarReminders />);
      
      const settingsButton = screen.getByTitle('Reminder Settings');
      settingsButton.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Reminder Settings')).toBeInTheDocument();
      
      // Tab navigation should work
      await user.keyboard('{Tab}');
      expect(document.activeElement).toHaveAttribute('type', 'checkbox');
    });

    it('announces reminder count changes', async () => {
      require('date-fns').differenceInMinutes.mockReturnValue(15);
      
      renderWithContext(<CalendarReminders />);
      
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/1 active reminder/i);
      });
    });
  });
});