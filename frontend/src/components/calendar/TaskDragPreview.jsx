import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { taskCalendarUtils } from '../../utils/taskCalendarUtils';
import { dateUtils } from '../../utils/dateUtils';

const TaskDragPreview = ({
  draggedTask,
  dragPosition,
  dropZone,
  isValidDrop = true,
  onDragEnd,
  className = ''
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Track mouse position during drag
  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({
        x: event.clientX,
        y: event.clientY
      });
    };

    if (draggedTask) {
      setIsDragging(true);
      document.addEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.body.style.cursor = '';
        setIsDragging(false);
      };
    }
  }, [draggedTask]);

  // Handle drag end
  useEffect(() => {
    if (!draggedTask && isDragging) {
      setIsDragging(false);
      if (onDragEnd) {
        onDragEnd();
      }
    }
  }, [draggedTask, isDragging, onDragEnd]);

  if (!draggedTask || !isDragging) {
    return null;
  }

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${className}`}>
      {/* Drag preview following cursor */}
      <motion.div
        className="absolute"
        style={{
          left: mousePosition.x + 10,
          top: mousePosition.y - 10,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <DragPreviewCard
          task={draggedTask}
          isValidDrop={isValidDrop}
          dropZone={dropZone}
        />
      </motion.div>

      {/* Drop zone indicator */}
      {dropZone && (
        <DropZoneIndicator
          dropZone={dropZone}
          isValidDrop={isValidDrop}
          task={draggedTask}
        />
      )}

      {/* Global drag overlay */}
      <div className="absolute inset-0 bg-black/5" />
    </div>
  );
};

// Drag preview card component
const DragPreviewCard = ({ task, isValidDrop, dropZone }) => {
  return (
    <motion.div
      className={`
        bg-white dark:bg-secondary-800 rounded-lg shadow-xl border-2 p-3 min-w-[200px] max-w-[300px]
        ${isValidDrop 
          ? 'border-green-400 dark:border-green-500' 
          : 'border-red-400 dark:border-red-500'
        }
      `}
      whileHover={{ scale: 1.02 }}
      layout
    >
      {/* Task info */}
      <div className="flex items-start space-x-3">
        {/* Task color indicator */}
        <div className={`
          w-3 h-3 rounded-full flex-shrink-0 mt-1
          ${taskCalendarUtils.getTaskColor(task).split(' ')[0]}
        `} />
        
        <div className="flex-1 min-w-0">
          {/* Task title */}
          <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 truncate">
            {task.title}
          </h4>
          
          {/* Task metadata */}
          <div className="flex items-center space-x-2 mt-1 text-xs text-secondary-600 dark:text-secondary-400">
            <span className="capitalize">{task.priority}</span>
            <span>•</span>
            <span className="capitalize">{task.status}</span>
            {task.due && (
              <>
                <span>•</span>
                <span>{dateUtils.formatDisplayDate(task.due)}</span>
              </>
            )}
          </div>
        </div>

        {/* Status icon */}
        <div className="flex-shrink-0">
          {task.status === 'completed' ? (
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
          ) : dateUtils.isTaskOverdue(task) ? (
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
          ) : (
            <ClockIcon className="w-4 h-4 text-blue-500" />
          )}
        </div>
      </div>

      {/* Drop zone info */}
      {dropZone && (
        <div className={`
          mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-700 
          flex items-center space-x-2 text-xs
          ${isValidDrop 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
          }
        `}>
          <ArrowRightIcon className="w-3 h-3" />
          <span>
            {isValidDrop 
              ? `Move to ${dropZone.label || 'selected date'}` 
              : 'Cannot drop here'
            }
          </span>
        </div>
      )}

      {/* Drag instruction */}
      <div className="mt-2 text-xs text-secondary-500 dark:text-secondary-400 text-center">
        {isValidDrop ? 'Release to drop' : 'Invalid drop zone'}
      </div>
    </motion.div>
  );
};

// Drop zone indicator component
const DropZoneIndicator = ({ dropZone, isValidDrop, task }) => {
  if (!dropZone.element) return null;

  const rect = dropZone.element.getBoundingClientRect();

  return (
    <motion.div
      className={`
        absolute border-2 border-dashed rounded-lg pointer-events-none
        ${isValidDrop 
          ? 'border-green-400 bg-green-50/50 dark:border-green-500 dark:bg-green-900/20' 
          : 'border-red-400 bg-red-50/50 dark:border-red-500 dark:bg-red-900/20'
        }
      `}
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      {/* Drop zone content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={`
            px-3 py-2 rounded-lg text-sm font-medium
            ${isValidDrop 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
            }
          `}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {isValidDrop ? (
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4" />
              <span>Drop here</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>Invalid drop</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Animated border */}
      <motion.div
        className={`
          absolute inset-0 border-2 rounded-lg
          ${isValidDrop ? 'border-green-400' : 'border-red-400'}
        `}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

// Hook for managing drag and drop state
export const useDragAndDrop = ({
  onTaskDrop,
  onDragStart,
  onDragEnd,
  validateDrop = () => true
}) => {
  const [dragState, setDragState] = useState({
    draggedTask: null,
    dragPosition: null,
    dropZone: null,
    isValidDrop: true
  });

  // Handle drag start
  const handleDragStart = useCallback((task, event) => {
    setDragState(prev => ({
      ...prev,
      draggedTask: task,
      dragPosition: { x: event.clientX, y: event.clientY }
    }));

    if (onDragStart) {
      onDragStart(task, event);
    }
  }, [onDragStart]);

  // Handle drag over
  const handleDragOver = useCallback((dropZoneInfo, event) => {
    event.preventDefault();
    
    const isValid = validateDrop(dragState.draggedTask, dropZoneInfo);
    
    setDragState(prev => ({
      ...prev,
      dropZone: dropZoneInfo,
      isValidDrop: isValid
    }));

    event.dataTransfer.dropEffect = isValid ? 'move' : 'none';
  }, [dragState.draggedTask, validateDrop]);

  // Handle drag leave
  const handleDragLeave = useCallback((event) => {
    // Only clear drop zone if we're actually leaving the drop area
    const rect = event.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = event;
    
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDragState(prev => ({
        ...prev,
        dropZone: null,
        isValidDrop: true
      }));
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((dropZoneInfo, event) => {
    event.preventDefault();
    
    if (dragState.draggedTask && dragState.isValidDrop && onTaskDrop) {
      onTaskDrop(dragState.draggedTask, dropZoneInfo, event);
    }

    // Reset drag state
    setDragState({
      draggedTask: null,
      dragPosition: null,
      dropZone: null,
      isValidDrop: true
    });
  }, [dragState.draggedTask, dragState.isValidDrop, onTaskDrop]);

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    setDragState({
      draggedTask: null,
      dragPosition: null,
      dropZone: null,
      isValidDrop: true
    });

    if (onDragEnd) {
      onDragEnd(event);
    }
  }, [onDragEnd]);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };
};

// Utility function to create drop zone info
export const createDropZoneInfo = (element, date, timeSlot = null, label = null) => {
  return {
    element,
    date,
    timeSlot,
    label: label || (timeSlot 
      ? `${dateUtils.formatDisplayDate(date)} at ${dateUtils.formatTimeSlot(timeSlot)}`
      : dateUtils.formatDisplayDate(date)
    ),
    type: timeSlot ? 'time-slot' : 'date'
  };
};

export default TaskDragPreview;