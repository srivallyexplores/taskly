import React from 'react';
import { UserIcon } from '@heroicons/react/24/solid';

const Avatar = ({ 
  src, 
  alt, 
  size = 'md', 
  className = '', 
  fallback,
  onClick 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  };

  const baseClasses = `
    ${sizeClasses[size]} 
    rounded-full 
    bg-gray-300 
    dark:bg-gray-600 
    flex 
    items-center 
    justify-center 
    overflow-hidden
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // If we have a valid image source, show the image
  if (src) {
    return (
      <div className={baseClasses} onClick={handleClick}>
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide the image if it fails to load
            e.target.style.display = 'none';
          }}
        />
        {/* Fallback content in case image fails to load */}
        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
          {fallback ? (
            <span className={`font-medium text-gray-700 dark:text-gray-300 ${textSizeClasses[size]}`}>
              {fallback}
            </span>
          ) : (
            <UserIcon className={`text-gray-500 dark:text-gray-400 ${iconSizeClasses[size]}`} />
          )}
        </div>
      </div>
    );
  }

  // If we have fallback text (like initials), show that
  if (fallback) {
    return (
      <div className={baseClasses} onClick={handleClick}>
        <span className={`font-medium text-gray-700 dark:text-gray-300 ${textSizeClasses[size]}`}>
          {fallback}
        </span>
      </div>
    );
  }

  // Default fallback with user icon
  return (
    <div className={baseClasses} onClick={handleClick}>
      <UserIcon className={`text-gray-500 dark:text-gray-400 ${iconSizeClasses[size]}`} />
    </div>
  );
};

export default Avatar;