import React, { forwardRef } from 'react';

const Input = forwardRef(({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error = false,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const baseClasses = 'block w-full px-3 py-2 text-sm bg-white dark:bg-secondary-800 border rounded-lg shadow-sm placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 transition-colors duration-200';
  
  const stateClasses = error
    ? 'border-error-300 dark:border-error-600 focus:ring-error-500 focus:border-error-500'
    : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500 focus:border-primary-500';
  
  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : '';
  
  const classes = `${baseClasses} ${stateClasses} ${disabledClasses} ${className}`;
  
  if (leftIcon || rightIcon) {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${classes} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={classes}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
export default Input;