import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fcp: null, // First Contentful Paint
    lcp: null, // Largest Contentful Paint
    fid: null, // First Input Delay
    cls: null, // Cumulative Layout Shift
    ttfb: null, // Time to First Byte
    memoryUsage: null,
    connectionType: null
  });
  
  const [performanceScore, setPerformanceScore] = useState(0);
  
  useEffect(() => {
    // Measure Core Web Vitals
    const measureWebVitals = () => {
      // First Contentful Paint
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
        
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          setMetrics(prev => ({ ...prev, cls: clsValue }));
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }
      
      // Navigation timing
      if ('performance' in window && performance.timing) {
        const timing = performance.timing;
        const ttfb = timing.responseStart - timing.navigationStart;
        setMetrics(prev => ({ ...prev, ttfb }));
      }
      
      // Memory usage
      if ('memory' in performance) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          }
        }));
      }
      
      // Connection type
      if ('connection' in navigator) {
        setMetrics(prev => ({
          ...prev,
          connectionType: navigator.connection.effectiveType
        }));
      }
    };
    
    measureWebVitals();
    
    // Update metrics periodically
    const interval = setInterval(measureWebVitals, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate performance score
  useEffect(() => {
    const calculateScore = () => {
      let score = 100;
      
      // FCP scoring (good: <1.8s, needs improvement: 1.8s-3s, poor: >3s)
      if (metrics.fcp) {
        if (metrics.fcp > 3000) score -= 20;
        else if (metrics.fcp > 1800) score -= 10;
      }
      
      // LCP scoring (good: <2.5s, needs improvement: 2.5s-4s, poor: >4s)
      if (metrics.lcp) {
        if (metrics.lcp > 4000) score -= 25;
        else if (metrics.lcp > 2500) score -= 15;
      }
      
      // FID scoring (good: <100ms, needs improvement: 100ms-300ms, poor: >300ms)
      if (metrics.fid) {
        if (metrics.fid > 300) score -= 20;
        else if (metrics.fid > 100) score -= 10;
      }
      
      // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
      if (metrics.cls) {
        if (metrics.cls > 0.25) score -= 15;
        else if (metrics.cls > 0.1) score -= 8;
      }
      
      setPerformanceScore(Math.max(0, score));
    };
    
    calculateScore();
  }, [metrics]);
  
  return { metrics, performanceScore };
};

// Image lazy loading component with performance optimization
export const LazyImage = React.memo(({ 
  src, 
  alt, 
  className = '', 
  placeholder = true,
  ...props 
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {placeholder && !loaded && (
        <div className="absolute inset-0 bg-secondary-200 dark:bg-secondary-700 animate-pulse" />
      )}
      
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          {...props}
        />
      )}
    </div>
  );
});

// Virtual scrolling component for large lists
export const VirtualizedList = ({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  className = '' 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);
  
  const visibleItems = useMemo(() => {
    if (!containerRef) return [];
    
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, itemHeight, containerHeight, scrollTop, containerRef]);
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  return (
    <div
      ref={setContainerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item) => (
          <div
            key={item.index}
            style={{
              position: 'absolute',
              top: item.index * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, item.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Debounced input component
export const DebouncedInput = React.memo(({ 
  value, 
  onChange, 
  delay = 300, 
  ...props 
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [localValue, delay, onChange]);
  
  return (
    <input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
});

// Performance dashboard component
const PerformanceDashboard = ({ className = '' }) => {
  const { metrics, performanceScore } = usePerformanceMonitor();
  const [showDetails, setShowDetails] = useState(false);
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-success-600 dark:text-success-400';
    if (score >= 70) return 'text-warning-600 dark:text-warning-400';
    return 'text-error-600 dark:text-error-400';
  };
  
  const getMetricStatus = (metric, thresholds) => {
    if (metric === null) return 'unknown';
    if (metric <= thresholds.good) return 'good';
    if (metric <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const webVitalThresholds = {
    fcp: { good: 1800, needsImprovement: 3000 },
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 }
  };
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
            <BoltIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Performance Monitor
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Real-time performance metrics
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
            {performanceScore}
          </div>
          <div className="text-xs text-secondary-500 dark:text-secondary-400">
            Performance Score
          </div>
        </div>
      </div>
      
      {/* Core Web Vitals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(webVitalThresholds).map(([key, thresholds]) => {
          const value = metrics[key];
          const status = getMetricStatus(value, thresholds);
          
          const statusColors = {
            good: 'text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/20',
            'needs-improvement': 'text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/20',
            poor: 'text-error-600 dark:text-error-400 bg-error-100 dark:bg-error-900/20',
            unknown: 'text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700'
          };
          
          const formatValue = (key, value) => {
            if (value === null) return 'N/A';
            if (key === 'cls') return value.toFixed(3);
            return `${Math.round(value)}ms`;
          };
          
          return (
            <div key={key} className={`p-3 rounded-lg ${statusColors[status]}`}>
              <div className="text-xs font-medium uppercase tracking-wide mb-1">
                {key.toUpperCase()}
              </div>
              <div className="text-lg font-bold">
                {formatValue(key, value)}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
          <ClockIcon className="w-5 h-5 text-blue-500" />
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              TTFB
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
          <CpuChipIcon className="w-5 h-5 text-purple-500" />
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              Memory
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              {metrics.memoryUsage 
                ? `${formatBytes(metrics.memoryUsage.used)} / ${formatBytes(metrics.memoryUsage.total)}`
                : 'N/A'
              }
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
          <SignalIcon className="w-5 h-5 text-green-500" />
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              Connection
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              {metrics.connectionType || 'Unknown'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Tips */}
      <div className="border-t border-secondary-200 dark:border-secondary-700 pt-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100"
        >
          <ChartBarIcon className="w-4 h-4" />
          <span>Performance Tips</span>
        </button>
        
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              {performanceScore < 90 && (
                <div className="flex items-start space-x-2 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                  <ExclamationTriangleIcon className="w-4 h-4 text-warning-600 dark:text-warning-400 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-warning-800 dark:text-warning-200">
                      Performance can be improved
                    </div>
                    <ul className="text-warning-700 dark:text-warning-300 text-xs mt-1 space-y-1">
                      {metrics.lcp > 2500 && <li>• Optimize largest contentful paint by compressing images</li>}
                      {metrics.fcp > 1800 && <li>• Reduce first contentful paint with code splitting</li>}
                      {metrics.fid > 100 && <li>• Improve first input delay by reducing JavaScript execution time</li>}
                      {metrics.cls > 0.1 && <li>• Minimize cumulative layout shift by setting image dimensions</li>}
                    </ul>
                  </div>
                </div>
              )}
              
              {performanceScore >= 90 && (
                <div className="flex items-start space-x-2 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <CheckCircleIcon className="w-4 h-4 text-success-600 dark:text-success-400 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-success-800 dark:text-success-200">
                      Excellent performance!
                    </div>
                    <div className="text-success-700 dark:text-success-300 text-xs mt-1">
                      Your app is performing well across all Core Web Vitals metrics.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Bundle analyzer component
export const BundleAnalyzer = ({ className = '' }) => {
  const [bundleStats, setBundleStats] = useState({
    totalSize: 0,
    gzippedSize: 0,
    chunks: [],
    assets: []
  });
  
  useEffect(() => {
    // Simulate bundle analysis (in real app, this would come from webpack-bundle-analyzer)
    setBundleStats({
      totalSize: 2.4 * 1024 * 1024, // 2.4MB
      gzippedSize: 0.8 * 1024 * 1024, // 800KB
      chunks: [
        { name: 'main', size: 1.2 * 1024 * 1024, gzipped: 400 * 1024 },
        { name: 'vendor', size: 0.8 * 1024 * 1024, gzipped: 280 * 1024 },
        { name: 'runtime', size: 0.4 * 1024 * 1024, gzipped: 120 * 1024 }
      ],
      assets: [
        { name: 'React', size: 0.5 * 1024 * 1024 },
        { name: 'Framer Motion', size: 0.3 * 1024 * 1024 },
        { name: 'Application Code', size: 0.4 * 1024 * 1024 },
        { name: 'Other Libraries', size: 0.2 * 1024 * 1024 }
      ]
    });
  }, []);
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <ChartBarIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Bundle Analysis
          </h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            JavaScript bundle size breakdown
          </p>
        </div>
      </div>
      
      {/* Size Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
          <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {formatBytes(bundleStats.totalSize)}
          </div>
          <div className="text-sm text-secondary-600 dark:text-secondary-400">
            Total Size
          </div>
        </div>
        
        <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
          <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {formatBytes(bundleStats.gzippedSize)}
          </div>
          <div className="text-sm text-secondary-600 dark:text-secondary-400">
            Gzipped Size
          </div>
        </div>
      </div>
      
      {/* Chunks Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
          Chunks
        </h4>
        <div className="space-y-2">
          {bundleStats.chunks.map((chunk, index) => (
            <div key={chunk.name} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-blue-500' : 
                  index === 1 ? 'bg-green-500' : 'bg-purple-500'
                }`} />
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {chunk.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {formatBytes(chunk.size)}
                </div>
                <div className="text-xs text-secondary-500 dark:text-secondary-400">
                  {formatBytes(chunk.gzipped)} gzipped
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Assets Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
          Top Assets
        </h4>
        <div className="space-y-2">
          {bundleStats.assets.map((asset, index) => {
            const percentage = (asset.size / bundleStats.totalSize) * 100;
            
            return (
              <div key={asset.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-900 dark:text-secondary-100">
                    {asset.name}
                  </span>
                  <span className="text-secondary-600 dark:text-secondary-400">
                    {formatBytes(asset.size)} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-600 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;