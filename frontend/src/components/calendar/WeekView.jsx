import React, { useState } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday
} from 'date-fns';
import { useCalendar } from '../../context/CalendarContext';
import CalendarTaskCard from './CalendarTaskCard';
import TaskQuickCreate from './TaskQuickCreate';

const WeekView = () => {
  const { currentDate, getTasksForDate, selectDate, updateTaskDate, draggedTask } = useCalendar();
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateDate, setQuickCreateDate] = useState(null);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handleDateClick = (date) => {
    selectDate(date);
    setQuickCreateDate(date);
    setShowQuickCreate(true);
  };

  const handleDrop = async (e, date) => {
    e.preventDefault();
    
    if (draggedTask) {
      await updateTaskDate(draggedTask._id, date);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <>
      <div className="flex-1 bg-white dark:bg-secondary-900 overflow-auto">
        <div className="grid grid-cols-7 gap-px bg-secondary-200 dark:bg-secondary-700">
          {days.map((day) => {
            const dayTasks = getTasksForDate(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toString()}
                onDrop={(e) => handleDrop(e, day)}
                onDragOver={handleDragOver}
                onClick={() => handleDateClick(day)}
                className="bg-white dark:bg-secondary-900 min-h-[500px] p-3 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                {/* Day header */}
                <div className="text-center mb-3">
                  <div className="text-xs font-medium text-secondary-600 dark:text-secondary-400">
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`
                      text-2xl font-semibold mt-1
                      ${isTodayDate ? 'bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto' : 'text-secondary-900 dark:text-secondary-100'}
                    `}
                  >
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  {dayTasks.map((task) => (
                    <CalendarTaskCard key={task._id} task={task} view="week" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showQuickCreate && (
        <TaskQuickCreate
          date={quickCreateDate}
          onClose={() => setShowQuickCreate(false)}
        />
      )}
    </>
  );
};

export default WeekView;
