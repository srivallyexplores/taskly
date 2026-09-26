import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: 20,
    scale: 0.98
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
};

// Slide transition variants
const slideVariants = {
  initial: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  in: {
    x: 0,
    opacity: 1
  },
  out: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

const slideTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.4
};

// Fade transition variants
const fadeVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1
  },
  out: {
    opacity: 0
  }
};

const fadeTransition = {
  duration: 0.2
};

// Scale transition variants
const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.9
  },
  in: {
    opacity: 1,
    scale: 1
  },
  out: {
    opacity: 0,
    scale: 1.1
  }
};

const scaleTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
};

// Main page transition wrapper
export const PageTransition = ({ 
  children, 
  variant = 'page',
  direction = 1,
  className = ''
}) => {
  const location = useLocation();

  const getVariants = () => {
    switch (variant) {
      case 'slide':
        return slideVariants;
      case 'fade':
        return fadeVariants;
      case 'scale':
        return scaleVariants;
      default:
        return pageVariants;
    }
  };

  const getTransition = () => {
    switch (variant) {
      case 'slide':
        return slideTransition;
      case 'fade':
        return fadeTransition;
      case 'scale':
        return scaleTransition;
      default:
        return pageTransition;
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        custom={direction}
        initial="initial"
        animate="in"
        exit="out"
        variants={getVariants()}
        transition={getTransition()}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Modal transition wrapper
export const ModalTransition = ({ 
  children, 
  isOpen, 
  onClose,
  className = ''
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// Drawer transition wrapper
export const DrawerTransition = ({ 
  children, 
  isOpen, 
  onClose,
  side = 'right',
  className = ''
}) => {
  const slideDirection = {
    right: { x: '100%' },
    left: { x: '-100%' },
    top: { y: '-100%' },
    bottom: { y: '100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Drawer Content */}
          <motion.div
            initial={slideDirection[side]}
            animate={{ x: 0, y: 0 }}
            exit={slideDirection[side]}
            transition={{ 
              type: 'tween',
              ease: 'easeInOut',
              duration: 0.3
            }}
            className={`fixed z-50 bg-white dark:bg-secondary-800 shadow-xl ${
              side === 'right' ? 'top-0 right-0 h-full' :
              side === 'left' ? 'top-0 left-0 h-full' :
              side === 'top' ? 'top-0 left-0 w-full' :
              'bottom-0 left-0 w-full'
            } ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Tab transition wrapper
export const TabTransition = ({ 
  children, 
  activeTab,
  className = ''
}) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

// List item transition wrapper
export const ListTransition = ({ 
  children,
  className = ''
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Stagger children animation
export const StaggerContainer = ({ 
  children,
  staggerDelay = 0.1,
  className = ''
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ 
  children,
  className = ''
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// View transition wrapper for different task views
export const ViewTransition = ({ 
  children, 
  currentView,
  className = ''
}) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={currentView}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

// Loading transition wrapper
export const LoadingTransition = ({ 
  loading, 
  children,
  fallback,
  className = ''
}) => (
  <AnimatePresence mode="wait">
    {loading ? (
      <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {fallback}
      </motion.div>
    ) : (
      <motion.div
        key="content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// Notification transition wrapper
export const NotificationTransition = ({ 
  children,
  className = ''
}) => (
  <motion.div
    initial={{ opacity: 0, x: 300, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 300, scale: 0.9 }}
    transition={{ 
      type: 'spring',
      stiffness: 300,
      damping: 30
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Collapse transition wrapper
export const CollapseTransition = ({ 
  isOpen, 
  children,
  className = ''
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`overflow-hidden ${className}`}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default {
  PageTransition,
  ModalTransition,
  DrawerTransition,
  TabTransition,
  ListTransition,
  StaggerContainer,
  StaggerItem,
  ViewTransition,
  LoadingTransition,
  NotificationTransition,
  CollapseTransition
};