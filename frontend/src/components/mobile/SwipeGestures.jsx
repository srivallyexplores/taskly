import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  CheckIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  StarIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const SwipeGestures = ({ 
  children, 
  onSwipeAction, 
  leftActions = [], 
  rightActions = [], 
  disabled = false,
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState(null);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  
  // Default actions if none provided
  const defaultLeftActions = [
    {
      id: 'complete',
      icon: CheckIcon,
      color: 'bg-success-500',
      label: 'Complete',
      threshold: 80
    }
  ];
  
  const defaultRightActions = [
    {
      id: 'edit',
      icon: PencilIcon,
      color: 'bg-primary-500',
      label: 'Edit',
      threshold: 80
    },
    {
      id: 'delete',
      icon: TrashIcon,
      color: 'bg-error-500',
      label: 'Delete',
      threshold: 120
    }
  ];
  
  const finalLeftActions = leftActions.length > 0 ? leftActions : defaultLeftActions;
  const finalRightActions = rightActions.length > 0 ? rightActions : defaultRightActions;
  
  // Transform values for background colors and action visibility
  const leftActionOpacity = useTransform(x, [0, 80], [0, 1]);
  const rightActionOpacity = useTransform(x, [0, -80], [0, 1]);
  const leftActionScale = useTransform(x, [0, 80], [0.8, 1]);
  const rightActionScale = useTransform(x, [0, -80], [0.8, 1]);
  
  const handleDragStart = () => {
    if (disabled) return;
    setIsDragging(true);
  };
  
  const handleDrag = (event, info) => {
    if (disabled) return;
    
    const currentX = info.offset.x;
    setDragDirection(currentX > 0 ? 'right' : 'left');
  };
  
  const handleDragEnd = (event, info) => {
    if (disabled) return;
    
    setIsDragging(false);
    setDragDirection(null);
    
    const currentX = info.offset.x;
    const velocity = info.velocity.x;
    
    // Determine which action to trigger based on distance and velocity
    if (currentX > 0) {
      // Swiping right (left actions)
      const triggeredAction = finalLeftActions.find(action => 
        Math.abs(currentX) >= action.threshold || Math.abs(velocity) > 500
      );
      
      if (triggeredAction) {
        onSwipeAction?.(triggeredAction.id, 'left');
      }
    } else if (currentX < 0) {
      // Swiping left (right actions)
      const triggeredAction = finalRightActions.find(action => 
        Math.abs(currentX) >= action.threshold || Math.abs(velocity) > 500
      );
      
      if (triggeredAction) {
        onSwipeAction?.(triggeredAction.id, 'right');
      }
    }
    
    // Reset position
    x.set(0);
  };
  
  const renderActions = (actions, side) => {
    return actions.map((action, index) => {
      const Icon = action.icon;
      const opacity = side === 'left' ? leftActionOpacity : rightActionOpacity;
      const scale = side === 'left' ? leftActionScale : rightActionScale;
      
      return (
        <motion.div
          key={action.id}
          style={{ opacity, scale }}
          className={`flex flex-col items-center justify-center px-4 h-full ${action.color} text-white`}
        >
          <Icon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{action.label}</span>
        </motion.div>
      );
    });
  };
  
  if (disabled) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div className={`relative overflow-hidden ${className}`} ref={constraintsRef}>
      {/* Left Actions Background */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 flex"
        style={{
          opacity: leftActionOpacity,
          x: useTransform(x, (value) => Math.min(0, value - 160))
        }}
      >
        {renderActions(finalLeftActions, 'left')}
      </motion.div>
      
      {/* Right Actions Background */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 flex"
        style={{
          opacity: rightActionOpacity,
          x: useTransform(x, (value) => Math.max(0, value + 160))
        }}
      >
        {renderActions(finalRightActions, 'right')}
      </motion.div>
      
      {/* Main Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.2}
        dragMomentum={false}
        style={{ x }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`relative z-10 bg-white dark:bg-secondary-800 transition-shadow duration-200 ${
          isDragging ? 'shadow-lg' : ''
        }`}
        whileDrag={{ scale: 0.98 }}
      >
        {children}
        
        {/* Drag Indicator */}
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Left indicator */}
            {dragDirection === 'right' && (
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex items-center space-x-2 text-success-500"
                >
                  <CheckIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Release to complete</span>
                </motion.div>
              </div>
            )}
            
            {/* Right indicator */}
            {dragDirection === 'left' && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <motion.div
                  animate={{ x: [0, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex items-center space-x-2 text-primary-500"
                >
                  <span className="text-sm font-medium">Release for actions</span>
                  <PencilIcon className="w-5 h-5" />
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Preset configurations for common use cases
export const SwipeableTaskItem = ({ task, onAction, children, className = '' }) => {
  const leftActions = [
    {
      id: 'complete',
      icon: CheckIcon,
      color: 'bg-success-500',
      label: 'Complete',
      threshold: 80
    }
  ];
  
  const rightActions = [
    {
      id: 'edit',
      icon: PencilIcon,
      color: 'bg-primary-500',
      label: 'Edit',
      threshold: 60
    },
    {
      id: 'star',
      icon: StarIcon,
      color: 'bg-warning-500',
      label: 'Star',
      threshold: 100
    },
    {
      id: 'delete',
      icon: TrashIcon,
      color: 'bg-error-500',
      label: 'Delete',
      threshold: 140
    }
  ];
  
  return (
    <SwipeGestures
      leftActions={leftActions}
      rightActions={rightActions}
      onSwipeAction={onAction}
      className={className}
    >
      {children}
    </SwipeGestures>
  );
};

export const SwipeableEmailItem = ({ email, onAction, children, className = '' }) => {
  const leftActions = [
    {
      id: 'archive',
      icon: ArchiveBoxIcon,
      color: 'bg-blue-500',
      label: 'Archive',
      threshold: 80
    }
  ];
  
  const rightActions = [
    {
      id: 'snooze',
      icon: ClockIcon,
      color: 'bg-orange-500',
      label: 'Snooze',
      threshold: 80
    },
    {
      id: 'delete',
      icon: TrashIcon,
      color: 'bg-error-500',
      label: 'Delete',
      threshold: 120
    }
  ];
  
  return (
    <SwipeGestures
      leftActions={leftActions}
      rightActions={rightActions}
      onSwipeAction={onAction}
      className={className}
    >
      {children}
    </SwipeGestures>
  );
};

export default SwipeGestures;