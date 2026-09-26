import { useState, useEffect } from 'react';

/**
 * Hook to detect mobile devices and screen sizes
 */
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  const [orientation, setOrientation] = useState('portrait');
  const [touchDevice, setTouchDevice] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Screen size detection
      if (width < 768) {
        setScreenSize('mobile');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
        setIsTablet(false);
      }

      // Orientation detection
      setOrientation(width > height ? 'landscape' : 'portrait');

      // Touch device detection
      setTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: screenSize === 'desktop',
    screenSize,
    orientation,
    touchDevice,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait'
  };
};

/**
 * Hook for responsive breakpoints
 */
export const useBreakpoints = () => {
  const [breakpoint, setBreakpoint] = useState('lg');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setBreakpoint('sm');
      } else if (width < 768) {
        setBreakpoint('md');
      } else if (width < 1024) {
        setBreakpoint('lg');
      } else if (width < 1280) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return {
    breakpoint,
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2Xl: breakpoint === '2xl',
    isSmUp: ['sm', 'md', 'lg', 'xl', '2xl'].includes(breakpoint),
    isMdUp: ['md', 'lg', 'xl', '2xl'].includes(breakpoint),
    isLgUp: ['lg', 'xl', '2xl'].includes(breakpoint),
    isXlUp: ['xl', '2xl'].includes(breakpoint)
  };
};

/**
 * Hook for mobile-specific behaviors
 */
export const useMobileBehavior = () => {
  const { isMobile, touchDevice } = useMobileDetection();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      // Detect virtual keyboard on mobile
      const heightDiff = window.screen.height - window.innerHeight;
      setIsKeyboardOpen(heightDiff > 150);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const preventZoom = (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  const enableTouchOptimizations = () => {
    if (touchDevice) {
      document.addEventListener('touchstart', preventZoom, { passive: false });
      return () => document.removeEventListener('touchstart', preventZoom);
    }
  };

  return {
    isMobile,
    touchDevice,
    isKeyboardOpen,
    scrollToTop,
    enableTouchOptimizations
  };
};

export default useMobileDetection;