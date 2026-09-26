import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const PullToRefresh = ({ 
  onRefresh, 
  children, 
  threshold = 80, 
  disabled = false,
  className = '' 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  
  const containerRef = useRef(null);
  const y = useMotionValue(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  // Transform values for the refresh indicator
  const refreshOpacity = useTransform(y, [0, threshold], [0, 1]);
  const refreshScale = useTransform(y, [0, threshold], [0.5, 1]);
  const refreshRotate = useTransform(y, [0, threshold * 2], [0, 360]);
  
  // Handle touch events
  const handleTouchStart = (e) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only allow pull-to-refresh when scrolled to the top
    if (container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  };
  
  const handleTouchMove = (e) => {
    if (disabled || isRefreshing || !isPulling) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setIsPulling(false);
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 0) {
      e.preventDefault(); // Prevent default scroll behavior
      
      // Apply elastic resistance
      const resistance = Math.min(deltaY * 0.5, threshold * 1.5);
      y.set(resistance);
      
      setCanRefresh(resistance >= threshold);
    }
  };
  
  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return;
    
    setIsPulling(false);
    
    if (canRefresh) {
      setIsRefreshing(true);
      
      // Animate to refresh position
      await animate(y, threshold, { duration: 0.2 });
      
      try {
        await onRefresh?.();
      } catch (error) {
        //console.error('Refresh failed:', error);
      } finally {
        // Animate back to original position
        await animate(y, 0, { duration: 0.3 });
        setIsRefreshing(false);
        setCanRefresh(false);
      }
    } else {
      // Animate back to original position
      animate(y, 0, { duration: 0.3 });
      setCanRefresh(false);
    }
  };
  
  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, isPulling, canRefresh]);
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Refresh Indicator */}
      <motion.div
        style={{
          y: useTransform(y, (value) => value - threshold),
          opacity: refreshOpacity
        }}
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center h-20"
      >
        <motion.div
          style={{ scale: refreshScale }}
          className={`flex flex-col items-center space-y-2 ${
            canRefresh ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-400 dark:text-secondary-500'
          }`}
        >
          <motion.div
            style={{ 
              rotate: isRefreshing ? refreshRotate : canRefresh ? 180 : 0 
            }}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
            className={`w-8 h-8 rounded-full border-2 border-current flex items-center justify-center ${
              isRefreshing ? 'bg-primary-50 dark:bg-primary-900/20' : ''
            }`}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </motion.div>
          
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: isPulling || isRefreshing ? 1 : 0 }}
            className="text-xs font-medium"
          >
            {isRefreshing 
              ? 'Refreshing...' 
              : canRefresh 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </motion.span>
        </motion.div>
      </motion.div>
      
      {/* Content Container */}
      <motion.div
        ref={containerRef}
        style={{ y }}
        className="h-full overflow-y-auto"
      >
        {children}
      </motion.div>
      
      {/* Loading Overlay */}
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white dark:bg-secondary-800 bg-opacity-50 dark:bg-opacity-50 flex items-start justify-center pt-20 pointer-events-none"
        >
          <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <ArrowPathIcon className="w-5 h-5" />
            </motion.div>
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Hook for programmatic refresh control
export const useRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refresh = async (refreshFunction) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshFunction?.();
    } catch (error) {
      //console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return { isRefreshing, refresh };
};

// Preset configurations for common use cases
export const RefreshableTaskList = ({ onRefresh, children, className = '' }) => {
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      threshold={100}
      className={className}
    >
      {children}
    </PullToRefresh>
  );
};

export const RefreshableFeed = ({ onRefresh, children, className = '' }) => {
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      threshold={80}
      className={className}
    >
      {children}
    </PullToRefresh>
  );
};

export default PullToRefresh;