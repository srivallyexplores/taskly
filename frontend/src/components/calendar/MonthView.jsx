import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';
import { useCalendar } from '../../context/CalendarContext';
import CalendarTaskCard from './CalendarTaskCard';
import TaskQuickCreate from './TaskQuickCreate';

const MonthView = () => {
  const { currentDate, getTasksForDate, selectDate, selectedDate } = useCalendar();
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateDate, setQuickCreateDate] = useState(null);

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (date) => {
    selectDate(date);
    setQuickCreateDate(date);
    setShowQuickCreate(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-secondary-500';
    }
  };

  return (
    <>
      <div className="flex-1 bg-white dark:bg-secondary-900">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-secondary-200 dark:border-secondary-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-semibold text-secondary-700 dark:text-secondary-300"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 auto-rows-fr" style={{ height: 'calc(100vh - 250px)' }}>
          {days.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`
                  border-r border-b border-secondary-200 dark:border-secondary-700 p-2 cursor-pointer
                  hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors
                  ${!isCurrentMonth ? 'bg-secondary-50 dark:bg-secondary-800/50' : ''}
                  ${isSelected ? 'ring-2 ring-primary-500 ring-inset' : ''}
                `}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-sm font-medium
                      ${!isCurrentMonth ? 'text-secondary-400 dark:text-secondary-600' : 'text-secondary-900 dark:text-secondary-100'}
                      ${isTodayDate ? 'bg-primary-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Tasks */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <CalendarTaskCard key={task._id} task={task} view="month" />
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 pl-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick create modal */}
      {showQuickCreate && (
        <TaskQuickCreate
          date={quickCreateDate}
          onClose={() => setShowQuickCreate(false)}
        />
      )}
    </>
  );
};

export default MonthView;
