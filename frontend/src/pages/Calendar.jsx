import React, { useEffect } from 'react';
import { useCalendar } from '../context/CalendarContext';
import CalendarHeader from '../components/calendar/CalendarHeader';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import AgendaView from '../components/calendar/AgendaView';
import { LoadingSpinner } from '../components/ui/LoadingStates';

const Calendar = () => {
  const { currentView, fetchEvents, loading } = useCalendar();

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const renderView = () => {
    switch (currentView) {
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      case 'agenda':
        return <AgendaView />;
      case 'month':
      default:
        return <MonthView />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-secondary-50 dark:bg-secondary-900">
      <CalendarHeader />
      
      {loading.events ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>
      )}
    </div>
  );
};

const CalendarWrapper = () => {
  return <Calendar />;
};

export default CalendarWrapper;