import React, { forwardRef } from 'react';

const Card = forwardRef(({
  children,
  className = '',
  elevated = false,
  interactive = false,
  padding = true,
  ...props
}, ref) => {
  const baseClasses = 'bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl transition-all duration-200';
  
  const elevatedClasses = elevated
    ? 'shadow-medium hover:shadow-large'
    : 'shadow-soft';
  
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:shadow-medium hover:border-secondary-300 dark:hover:border-secondary-600'
    : '';
  
  const paddingClasses = padding ? 'p-6' : '';
  
  const classes = `${baseClasses} ${elevatedClasses} ${interactiveClasses} ${paddingClasses} ${className}`;
  
  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export { Card };
export default Card;