import React, { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

const SafeImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback,
  fallbackSrc, // Accept fallbackSrc prop
  onError,
  onLoad,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (e) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = (e) => {
    setIsLoading(false);
    if (onLoad) {
      onLoad(e);
    }
  };

  // If there's an error or no src, show fallback
  if (hasError || !src) {
    // If fallbackSrc is provided, show that image
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          {...props}
        />
      );
    }
    
    // If fallback component is provided, show that
    if (fallback) {
      return fallback;
    }
    
    // Default fallback icon
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
        <PhotoIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
};

export default SafeImage;