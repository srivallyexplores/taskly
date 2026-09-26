import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardGrid = ({ 
  widgets = [], 
  onWidgetReorder, 
  onWidgetRemove,
  customizable = true,
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const gridClasses = `
    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6
    gap-6 auto-rows-min
    ${isDragging ? 'select-none' : ''}
    ${className}
  `;
  
  return (
    <div className={gridClasses}>
      <AnimatePresence mode="popLayout">
        {widgets.map((widget, index) => (
          <motion.div
            key={widget.id || index}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {React.cloneElement(widget, {
              onRemove: onWidgetRemove ? () => onWidgetRemove(index) : undefined,
            })}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Grid layout presets
export const GRID_LAYOUTS = {
  default: {
    name: 'Default',
    description: 'Balanced layout with key metrics and charts',
    widgets: [
      { id: 'task-overview', size: 'md', position: 0 },
      { id: 'productivity-chart', size: 'lg', position: 1 },
      { id: 'recent-activity', size: 'md', position: 2 },
      { id: 'upcoming-deadlines', size: 'md', position: 3 },
      { id: 'achievement-progress', size: 'sm', position: 4 },
      { id: 'team-activity', size: 'sm', position: 5 },
    ],
  },
  compact: {
    name: 'Compact',
    description: 'Dense layout with more widgets in less space',
    widgets: [
      { id: 'task-overview', size: 'sm', position: 0 },
      { id: },
      { id: 'recent-activity', size: 'sm', position: 2 },
      { id: 'upcoming-deadlines', size: 'sm', position: 3 },
      { id: 'achievement-progress'4 },
      { id: 't 5 },
    ],
  },
  detailed: {
    name: 'Detailed',
    description,
    widgets: [
      { id: 'task-overview', size: 'lg', posit
      { id: 'productivity-chart', size: 'xl', pn: 1 },
      { id: 'recent-activi
      { id: 'upcoming-deadlines', size: 'lg', position: 3 },
    ],
  },
};

export default DashboardGrid;