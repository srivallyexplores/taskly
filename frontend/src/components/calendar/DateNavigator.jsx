import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';
import { dateUtils } from '../../utils/dateUtils';

const DateNavigator = ({ 
  showDatePicker = false, 
  onDatePickerToggle,
  className = '' 
}) => {
  const {
    currentDate,
    setCurrentDate,
    navigateDate,
    goToToday,
    settings
  } = useCalendar();

  const [isPickerOpen, setIsPickerOpen] = useState(showDatePicker);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [pickerView, setPickerView] = useState('calendar'); // 'calendar', 'months', 'years'
  
  const pickerRef = useRef(null);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Update picker state when currentDate changes
  useEffect(() => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
  }, [currentDate]);

  // Handle outside click to close picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        closePicker();
      }
    };

    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPickerOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isPickerOpen) return;

      switch (event.key) {
        case 'Escape':
          closePicker();
          break;
        case 'Enter':
          if (pickerView === 'calendar') {
            handleDateSelect(new Date(selectedYear, selectedMonth, currentDate.getDate()));
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (pickerView === 'calendar') {
            navigatePickerMonth(-1);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (pickerView === 'calendar') {
            navigatePickerMonth(1);
          }
          break;
        default:
          break;
      }
    };

    if (isPickerOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isPickerOpen, pickerView, selectedYear, selectedMonth]);

  // Open/close picker
  const openPicker = () => {
    setIsPickerOpen(true);
    if (onDatePickerToggle) onDatePickerToggle(true);
  };

  const closePicker = () => {
    setIsPickerOpen(false);
    setPickerView('calendar');
    if (onDatePickerToggle) onDatePickerToggle(false);
  };

  // Navigate picker month
  const navigatePickerMonth = (direction) => {
    const newDate = new Date(selectedYear, selectedMonth + direction, 1);
    setSelectedYear(newDate.getFullYear());
    setSelectedMonth(newDate.getMonth());
  };

  // Navigate picker year
  const navigatePickerYear = (direction) => {
    setSelectedYear(prev => prev + direction);
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setCurrentDate(date);
    closePicker();
  };

  // Handle month selection
  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(monthIndex);
    setPickerView('calendar');
  };

  // Handle year selection
  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setPickerView('calendar');
  };

  // Generate calendar grid for picker
  const generateCalendarGrid = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const startDate = dateUtils.getWeekRange(firstDay, settings.weekStartsOn).start;
    const endDate = dateUtils.getWeekRange(lastDay, settings.weekStartsOn).end;
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Generate year range for year picker
  const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;
    const endYear = currentYear + 50;
    const years = [];
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    
    return years;
  };

  // Render calendar view
  const renderCalendarView = () => {
    const calendarDays = generateCalendarGrid();
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const startDay = settings.weekStartsOn;
    const orderedWeekDays = [...weekDays.slice(startDay), ...weekDays.slice(0, startDay)];

    return (
      <div className="p-4">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigatePickerMonth(-1)}
            className="p-1 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPickerView('months')}
              className="px-2 py-1 text-sm font-medium hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded"
            >
              {monthNames[selectedMonth]}
            </button>
            <button
              onClick={() => setPickerView('years')}
              className="px-2 py-1 text-sm font-medium hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded"
            >
              {selectedYear}
            </button>
          </div>
          
          <button
            onClick={() => navigatePickerMonth(1)}
            className="p-1 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {orderedWeekDays.map((day, index) => (
            <div
              key={index}
              className="p-2 text-center text-xs font-medium text-secondary-500 dark:text-secondary-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === selectedMonth;
            const isToday = dateUtils.isToday(day);
            const isSelected = dateUtils.isSameDate(day, currentDate);

            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDateSelect(day)}
                className={`
                  p-2 text-sm rounded transition-colors
                  ${isCurrentMonth 
                    ? 'text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700' 
                    : 'text-secondary-400 dark:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                  }
                  ${isToday ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold' : ''}
                  ${isSelected ? 'bg-primary-600 text-white' : ''}
                `}
              >
                {day.getDate()}
              </motion.button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <button
            onClick={() => handleDateSelect(new Date())}
            className="px-3 py-1 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
          >
            Today
          </button>
          <button
            onClick={closePicker}
            className="px-3 py-1 text-sm text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Render months view
  const renderMonthsView = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setPickerView('calendar')}
          className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100"
        >
          ← Back
        </button>
        <h3 className="font-medium">{selectedYear}</h3>
        <div></div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {monthNames.map((month, index) => (
          <motion.button
            key={month}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMonthSelect(index)}
            className={`
              p-3 text-sm rounded transition-colors
              ${index === selectedMonth 
                ? 'bg-primary-600 text-white' 
                : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
              }
            `}
          >
            {month}
          </motion.button>
        ))}
      </div>
    </div>
  );

  // Render years view
  const renderYearsView = () => {
    const years = generateYearRange();
    const currentYear = new Date().getFullYear();
    
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setPickerView('calendar')}
            className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100"
          >
            ← Back
          </button>
          <h3 className="font-medium">Select Year</h3>
          <div></div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {years.map((year) => (
            <motion.button
              key={year}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleYearSelect(year)}
              className={`
                p-2 text-sm rounded transition-colors
                ${year === selectedYear 
                  ? 'bg-primary-600 text-white' 
                  : year === currentYear
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                }
              `}
            >
              {year}
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Date picker trigger button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={openPicker}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
      >
        <CalendarDaysIcon className="w-4 h-4" />
        <span>Select Date</span>
      </motion.button>

      {/* Date picker modal */}
      <AnimatePresence>
        {isPickerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={closePicker}
            />
            
            {/* Picker modal */}
            <motion.div
              ref={pickerRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full left-0 mt-2 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 z-50 min-w-[300px]"
            >
              {/* Close button */}
              <button
                onClick={closePicker}
                className="absolute top-2 right-2 p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>

              {/* Picker content */}
              <AnimatePresence mode="wait">
                {pickerView === 'calendar' && (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {renderCalendarView()}
                  </motion.div>
                )}
                
                {pickerView === 'months' && (
                  <motion.div
                    key="months"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {renderMonthsView()}
                  </motion.div>
                )}
                
                {pickerView === 'years' && (
                  <motion.div
                    key="years"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {renderYearsView()}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateNavigator;