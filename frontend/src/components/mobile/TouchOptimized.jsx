import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

// Touch-optimized Button with proper sizing and feedback
export const TouchButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  className = '',
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const sizeClasses = {
    sm: 'px-4 py-3 text-sm min-h-[44px]', // 44px minimum touch target
    md: 'px-6 py-4 text-base min-h-[48px]',
    lg: 'px-8 py-5 text-lg min-h-[52px]'
  };
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-secondary-200 dark:bg-secondary-700 hover:bg-secondary-300 dark:hover:bg-secondary-600 text-secondary-900 dark:text-secondary-100',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
    ghost: 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
  };
  
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative rounded-xl font-medium transition-all duration-200 
        focus:outline-none focus:ring-4 focus:ring-primary-500/20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        ${isPressed ? 'shadow-inner' : 'shadow-sm'}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Touch-optimized Modal with slide-up animation
export const TouchModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showHandle = true 
}) => {
  const [dragY, setDragY] = useState(0);
  const modalRef = useRef(null);
  
  const sizeClasses = {
    sm: 'max-h-[50vh]',
    md: 'max-h-[70vh]',
    lg: 'max-h-[90vh]',
    full: 'h-full'
  };
  
  const handleDragEnd = (event, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose?.();
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`
              fixed bottom-0 left-0 right-0 z-50 
              bg-white dark:bg-secondary-800 
              rounded-t-3xl shadow-2xl
              ${sizeClasses[size]}
            `}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1 bg-secondary-300 dark:bg-secondary-600 rounded-full" />
              </div>
            )}
            
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
                <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  {title}
                </h2>
                <TouchButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 min-h-[40px]"
                >
                  <XMarkIcon className="w-5 h-5" />
                </TouchButton>
              </div>
            )}
            
            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Touch-optimized Input with larger touch targets
export const TouchInput = ({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Icon className="w-5 h-5 text-secondary-400" />
          </div>
        )}
        
        <input
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 py-4 text-base min-h-[48px]
            bg-white dark:bg-secondary-800
            border-2 rounded-xl
            transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-primary-500/20
            ${Icon ? 'pl-12' : ''}
            ${error 
              ? 'border-error-500 text-error-900 dark:text-error-100' 
              : isFocused 
                ? 'border-primary-500' 
                : 'border-secondary-300 dark:border-secondary-600'
            }
            ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
    </div>
  );
};

// Touch-optimized Select with large touch targets
export const TouchSelect = ({ 
  label, 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select an option',
  error,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find(opt => opt.value === value) || null
  );
  
  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange?.(option.value);
    setIsOpen(false);
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <TouchButton
          variant="outline"
          onClick={() => setIsOpen(true)}
          className={`
            w-full justify-between text-left
            ${error ? 'border-error-500' : ''}
            ${!selectedOption ? 'text-secondary-500 dark:text-secondary-400' : ''}
          `}
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDownIcon className="w-5 h-5" />
        </TouchButton>
        
        {/* Options Modal */}
        <TouchModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={label || 'Select Option'}
          size="md"
        >
          <div className="space-y-2">
            {options.map((option) => (
              <TouchButton
                key={option.value}
                variant={selectedOption?.value === option.value ? 'primary' : 'ghost'}
                onClick={() => handleSelect(option)}
                className="w-full justify-start"
              >
                {option.label}
              </TouchButton>
            ))}
          </div>
        </TouchModal>
      </div>
      
      {error && (
        <p className="text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
    </div>
  );
};

// Touch-optimized Accordion
export const TouchAccordion = ({ items = [], className = '' }) => {
  const [openItems, setOpenItems] = useState(new Set());
  
  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openItems.has(index);
        
        return (
          <div
            key={index}
            className="border border-secondary-200 dark:border-secondary-700 rounded-xl overflow-hidden"
          >
            <TouchButton
              variant="ghost"
              onClick={() => toggleItem(index)}
              className="w-full justify-between p-4 rounded-none border-none"
            >
              <span className="font-medium">{item.title}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUpIcon className="w-5 h-5" />
              </motion.div>
            </TouchButton>
            
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 text-secondary-600 dark:text-secondary-400">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// Touch-optimized Card with proper spacing
export const TouchCard = ({ 
  children, 
  className = '', 
  onClick, 
  interactive = false,
  ...props 
}) => {
  return (
    <motion.div
      whileTap={interactive ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        bg-white dark:bg-secondary-800 
        rounded-xl border border-secondary-200 dark:border-secondary-700
        p-6 shadow-sm
        ${interactive ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Touch-optimized List Item
export const TouchListItem = ({ 
  children, 
  onClick, 
  rightElement, 
  leftElement,
  className = '' 
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex items-center space-x-4 p-4 min-h-[60px]
        bg-white dark:bg-secondary-800
        border-b border-secondary-200 dark:border-secondary-700
        cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700
        transition-colors duration-200
        ${className}
      `}
    >
      {leftElement && (
        <div className="flex-shrink-0">
          {leftElement}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        {children}
      </div>
      
      {rightElement && (
        <div className="flex-shrink-0">
          {rightElement}
        </div>
      )}
    </motion.div>
  );
};

// Responsive Grid that adapts to screen size
export const ResponsiveGrid = ({ 
  children, 
  minItemWidth = 280, 
  gap = 4, 
  className = '' 
}) => {
  return (
    <div
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`
      }}
    >
      {children}
    </div>
  );
};

export default {
  TouchButton,
  TouchModal,
  TouchInput,
  TouchSelect,
  TouchAccordion,
  TouchCard,
  TouchListItem,
  ResponsiveGrid
};