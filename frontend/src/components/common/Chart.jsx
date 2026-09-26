import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const Chart = ({ 
  type = 'bar', 
  data = [], 
  title, 
  className = '',
  height = 300,
  loading = false,
  error = null
}) => {
  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
        )}
        <div className="animate-pulse">
          <div className="flex items-end justify-between space-x-2" style={{ height: `${height}px` }}>
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="bg-gray-200 dark:bg-gray-700 rounded-t"
                style={{
                  height: `${Math.random() * 80 + 20}%`,
                  width: '100%'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
        )}
        <div className="text-center py-8">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Normalize data format - handle both simple array and chart.js format
  let chartData = [];
  let chartType = type;
  
  if (data && typeof data === 'object') {
    if (data.data && data.data.labels && data.data.datasets) {
      // Chart.js format: { type, data: { labels, datasets } }
      chartType = data.type || type;
      const labels = data.data.labels;
      const values = data.data.datasets[0]?.data || [];
      chartData = labels.map((label, index) => ({
        label: String(label),
        value: values[index] || 0
      }));
    } else if (Array.isArray(data)) {
      // Simple array format: [{ label, value }]
      chartData = data;
    } else {
      // Invalid format
      chartData = [];
    }
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
        )}
        <div className="text-center py-8">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No data available
          </p>
        </div>
      </div>
    );
  }

  // Simple bar chart implementation
  const maxValue = Math.max(...chartData.map(item => item.value || 0));
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      
      <div className="relative" style={{ height: `${height}px` }}>
        {(chartType === 'bar' || chartType === 'horizontalBar') && (
          <div className="flex items-end justify-between space-x-2 h-full">
            {chartData.map((item, index) => {
              const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-blue-500 dark:bg-blue-400 rounded-t transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-300 w-full"
                    style={{ height: `${barHeight}%` }}
                    title={`${item.label}: ${item.value}`}
                  />
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {chartType === 'line' && (
          <div className="relative h-full">
            <svg className="w-full h-full">
              {chartData.length > 1 && (
                <polyline
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="2"
                  points={chartData.map((item, index) => {
                    const x = (index / (chartData.length - 1)) * 100;
                    const y = 100 - (maxValue > 0 ? (item.value / maxValue) * 100 : 0);
                    return `${x}%,${y}%`;
                  }).join(' ')}
                />
              )}
              {chartData.map((item, index) => {
                const x = chartData.length > 1 ? (index / (chartData.length - 1)) * 100 : 50;
                const y = 100 - (maxValue > 0 ? (item.value / maxValue) * 100 : 0);
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="rgb(59, 130, 246)"
                    className="hover:r-6 transition-all duration-200"
                  >
                    <title>{`${item.label}: ${item.value}`}</title>
                  </circle>
                );
              })}
            </svg>
            <div className="flex justify-between mt-2">
              {chartData.map((item, index) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {(chartType === 'pie' || chartType === 'doughnut') && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {chartType === 'doughnut' ? 'Doughnut' : 'Pie'} chart visualization coming soon
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      {chartData.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded mr-2" />
              <span className="text-gray-600 dark:text-gray-400">
                {item.label}: {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chart;