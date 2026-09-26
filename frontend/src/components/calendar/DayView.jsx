import React from 'react';
import { format, isToday } from 'date-fns';
import { useCalendar } from '../../context/CalendarContext';
import CalendarTaskCard from './CalendarTaskCard';

const DayView = () => {
  const { currentDate, getTasksForDate, updateTaskDate, draggedTask } = useCalendar();
  const dayTasks = getTasksForDate(currentDate);
  const isTodayDate = isToday(currentDate);

  const handleDrop = async (e) => {
    e.preventDefault();
    
    if (draggedTask) {
      await updateTaskDate(draggedTask._id, currentDate);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div 
      className="flex-1 bg-white dark:bg-secondary-900 overflow-auto p-6"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Day header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div
            className={`
              text-4xl font-bold
              ${isTodayDate ? 'bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center' : 'text-secondary-900 dark:text-secondary-100'}
            `}
          >
            {format(currentDate, 'd')}
          </div>
          <div>
            <div className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
              {format(currentDate, 'EEEE')}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              {format(currentDate, 'MMMM yyyy')}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {dayTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-500 dark:text-secondary-400">
              No tasks scheduled for this day
            </p>
            <p className="text-sm text-secondary-400 dark:text-secondary-500 mt-2">
              Click on the day to add a new task
            </p>
          </div>
        ) : (
          dayTasks.map((task) => (
            <CalendarTaskCard key={task._id} task={task} view="day" />
          ))
        )}
      </div>
    </div>
  );
};

export default DayView;
