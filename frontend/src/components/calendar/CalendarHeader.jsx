import React from 'react';
import { format } from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';

const CalendarHeader = () => {
  const {
    currentView,
    currentDate,
    setView,
    navigatePrevious,
    navigateNext,
    navigateToToday
  } = useCalendar();

  const getDateRangeText = () => {
    switch (currentView) {
      case 'day':
        return format(currentDate, 'MMMM d, yyyy');
      case 'week':
        return format(currentDate, 'MMMM yyyy');
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'agenda':
        return 'Agenda';
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Date navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={navigateToToday}
            className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-600 transition-colors"
          >
            Today
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={navigatePrevious}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
              aria-label="Previous"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={navigateNext}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
              aria-label="Next"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {getDateRangeText()}
          </h2>
        </div>

        {/* Right: View selector */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                currentView === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-medium border-l border-secondary-300 dark:border-secondary-600 transition-colors ${
                currentView === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 text-sm font-medium border-l border-secondary-300 dark:border-secondary-600 transition-colors ${
                currentView === 'day'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('agenda')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border-l border-secondary-300 dark:border-secondary-600 transition-colors ${
                currentView === 'agenda'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
