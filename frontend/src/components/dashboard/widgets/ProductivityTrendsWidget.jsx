import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { DashboardWidget } from '../index';
import { TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ProductivityTrendsWidget = ({ 
  data = [],
  timeframe = 'week',
  loading = false,
  error = null 
}) => {
  // Generate sample data if none provided
  const sampleData = data.length > 0 ? data : [
    { date: '2024-01-01', completed: 5, productivity: 85 },
    { date: '2024-01-02', completed: 8, productivity: 92 },
    { date: '2024-01-03', completed: 6, productivity: 78 },
    { date: '2024-01-04', completed: 10, productivity: 95 },
    { date: '2024-01-05', completed: 7, productivity: 88 },
    { date: '2024-01-06', completed: 9, productivity: 91 },
    { date: '2024-01-07', completed: 12, productivity: 98 },
  ];
  
  const labels = sampleData.map(item => {
    const date = new Date(item.date);
    return timeframe === 'week' 
      ? date.toLocaleDateString('en-US', { weekday: 'short' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Tasks Completed',
        data: sampleData.map(item => item.completed),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'rgb(255, 255, 255)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Productivity Score',
        data: sampleData.map(item => item.productivity),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'rgb(255, 255, 255)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
        },
        title: {
          display: true,
          text: 'Tasks',
          color: 'rgb(107, 114, 128)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
        },
        title: {
          display: true,
          text: 'Score',
          color: 'rgb(107, 114, 128)',
        },
      },
    },
  };
  
  // Calculate trend
  const currentWeekAvg = sampleData.slice(-7).reduce((sum, item) => sum + item.completed, 0) / 7;
  const previousWeekAvg = sampleData.slice(-14, -7).reduce((sum, item) => sum + item.completed, 0) / 7;
  const trend = currentWeekAvg - previousWeekAvg;
  const trendPercentage = previousWeekAvg > 0 ? Math.round((trend / previousWeekAvg) * 100) : 0;
  
  return (
    <DashboardWidget
      title="Productivity Trends"
      subtitle={`Your ${timeframe}ly performance overview`}
      size="lg"
      loading={loading}
      error={error}
    >
      <div className="h-full flex flex-col">
        {/* Trend Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Tasks</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Score</span>
            </div>
          </div>
          
          <div className="flex items-center">
            {trend >= 0 ? (
              <TrendingUpIcon className="w-4 h-4 text-success-500 mr-1" />
            ) : (
              <TrendingDownIcon className="w-4 h-4 text-error-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${
              trend >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
            }`}>
              {trend >= 0 ? '+' : ''}{trendPercentage}%
            </span>
          </div>
        </div>
        
        {/* Chart */}
        <div className="flex-1 min-h-0">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </DashboardWidget>
  );
};

export default ProductivityTrendsWidget;