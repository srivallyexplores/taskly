import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Hook to detect screen size and device type
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  const [deviceType, setDeviceType] = useState('desktop');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Determine device type based on width and touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType(isTouchDevice ? 'desktop-touch' : 'desktop');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const breakpoints = {
    isMobile: screenSize.width < 640,
    isTablet: screenSize.width >= 640 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isLarge: screenSize.width >= 1280,
    isXLarge: screenSize.width >= 1536
  };
  
  return {
    screenSize,
    deviceType,
    ...breakpoints
  };
};

// Responsive Container that adapts padding and layout
export const ResponsiveContainer = ({ 
  children, 
  className = '',
  mobilePadding = 'px-4',
  tabletPadding = 'px-6',
  desktopPadding = 'px-8'
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  const paddingClass = isMobile ? mobilePadding : isTablet ? tabletPadding : desktopPadding;
  
  return (
    <div className={`${paddingClass} ${className}`}>
      {children}
    </div>
  );
};

// Adaptive Layout that changes based on screen size
export const AdaptiveLayout = ({ 
  children,
  mobileLayout,
  tabletLayout,
  desktopLayout,
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  let currentLayout = children;
  
  if (isMobile && mobileLayout) {
    currentLayout = mobileLayout;
  } else if (isTablet && tabletLayout) {
    currentLayout = tabletLayout;
  } else if (isDesktop && desktopLayout) {
    currentLayout = desktopLayout;
  }
  
  return (
    <motion.div
      key={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {currentLayout}
    </motion.div>
  );
};

// Stack layout that changes direction based on screen size
export const ResponsiveStack = ({ 
  children, 
  direction = 'vertical', // 'vertical', 'horizontal', 'responsive'
  spacing = 4,
  mobileDirection = 'vertical',
  tabletDirection = 'horizontal',
  desktopDirection = 'horizontal',
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  let currentDirection = direction;
  
  if (direction === 'responsive') {
    if (isMobile) {
      currentDirection = mobileDirection;
    } else if (isTablet) {
      currentDirection = tabletDirection;
    } else {
      currentDirection = desktopDirection;
    }
  }
  
  const isVertical = currentDirection === 'vertical';
  const flexDirection = isVertical ? 'flex-col' : 'flex-row';
  const gapClass = `gap-${spacing}`;
  
  return (
    <div className={`flex ${flexDirection} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

// Grid that adapts columns based on screen size
export const ResponsiveGrid = ({ 
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  largeColumns = 4,
  gap = 4,
  className = ''
}) => {
  const { isMobile, isTablet, isLarge } = useResponsive();
  
  let columns = desktopColumns;
  
  if (isMobile) {
    columns = mobileColumns;
  } else if (isTablet) {
    columns = tabletColumns;
  } else if (isLarge) {
    columns = largeColumns;
  }
  
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };
  
  return (
    <div className={`grid ${gridCols[columns]} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

// Sidebar layout that collapses on mobile
export const ResponsiveSidebar = ({ 
  sidebar,
  children,
  sidebarWidth = 'w-64',
  collapsedWidth = 'w-16',
  isCollapsed = false,
  className = ''
}) => {
  const { isMobile } = useResponsive();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  if (isMobile) {
    return (
      <div className={`relative ${className}`}>
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`fixed top-0 left-0 bottom-0 z-50 ${sidebarWidth} bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700`}
            >
              {sidebar}
            </motion.div>
          </>
        )}
        
        {/* Main Content */}
        <div className="w-full">
          {children}
        </div>
      </div>
    );
  }
  
  // Desktop Layout
  return (
    <div className={`flex ${className}`}>
      <motion.div
        animate={{ width: isCollapsed ? collapsedWidth : sidebarWidth }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 overflow-hidden"
      >
        {sidebar}
      </motion.div>
      
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};

// Modal that adapts to screen size
export const ResponsiveModal = ({ 
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className = ''
}) => {
  const { isMobile } = useResponsive();
  
  const sizeClasses = {
    sm: isMobile ? 'max-w-full' : 'max-w-md',
    md: isMobile ? 'max-w-full' : 'max-w-lg',
    lg: isMobile ? 'max-w-full' : 'max-w-2xl',
    xl: isMobile ? 'max-w-full' : 'max-w-4xl'
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: isMobile ? '100%' : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: isMobile ? '100%' : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`
            relative w-full ${sizeClasses[size]} 
            ${isMobile ? 'fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[90vh]' : 'rounded-2xl max-h-[80vh]'}
            bg-white dark:bg-secondary-800 
            border border-secondary-200 dark:border-secondary-700
            shadow-2xl overflow-hidden
            ${className}
          `}
        >
          {isMobile && (
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 bg-secondary-300 dark:bg-secondary-600 rounded-full" />
            </div>
          )}
          
          {title && (
            <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                {title}
              </h2>
            </div>
          )}
          
          <div className="overflow-y-auto flex-1 p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Text that scales based on screen size
export const ResponsiveText = ({ 
  children,
  mobileSize = 'text-sm',
  tabletSize = 'text-base',
  desktopSize = 'text-lg',
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  const textSize = isMobile ? mobileSize : isTablet ? tabletSize : desktopSize;
  
  return (
    <span className={`${textSize} ${className}`}>
      {children}
    </span>
  );
};

// Show/hide components based on screen size
export const ShowOn = ({ mobile, tablet, desktop, children }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const shouldShow = (
    (mobile && isMobile) ||
    (tablet && isTablet) ||
    (desktop && isDesktop)
  );
  
  return shouldShow ? children : null;
};

export const HideOn = ({ mobile, tablet, desktop, children }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const shouldHide = (
    (mobile && isMobile) ||
    (tablet && isTablet) ||
    (desktop && isDesktop)
  );
  
  return shouldHide ? null : children;
};

export default {
  useResponsive,
  ResponsiveContainer,
  AdaptiveLayout,
  ResponsiveStack,
  ResponsiveGrid,
  ResponsiveSidebar,
  ResponsiveModal,
  ResponsiveText,
  ShowOn,
  HideOn
};