import React from 'react';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { DashboardWidget } from '../index';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

ChartJS.register(ArcElement, Tooltip, Legend);

const TaskCompletionWidget = ({ 
  data = { completed: 0, inProgress: 0, failed: 0 },
  loading = false,
  error = null 
}) => {
  const total = data.completed + data.inProgress + data.failed;
  const completionRate = total > 0 ? Math.round((data.completed / total) * 100) : 0;
  
  const chartData = {
    labels: ['Completed', 'In Progress', 'Failed'],
    datasets: [
      {
        data: [data.completed, data.inProgress, data.failed],
        backgroundColor: [
          'rgb(16, 185, 129)', // success-500
          'rgb(59, 130, 246)',  // primary-500
          'rgb(239, 68, 68)',   // error-500
        ],
        borderColor: [
          'rgb(5, 150, 105)',   // success-600
          'rgb(37, 99, 235)',   // primary-600
          'rgb(220, 38, 38)',   // error-600
        ],
        borderWidth: 2,
        cutout: '70%',
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };
  
  const stats = [
    {
      label: 'Completed',
      value: data.completed,
      icon: CheckCircleIcon,
      color: 'text-success-600 dark:text-success-400',
      bgColor: 'bg-success-100 dark:bg-success-900/20',
    },
    {
      label: 'In Progress',
      value: data.inProgress,
      icon: ClockIcon,
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/20',
    },
    {
      label: 'Failed',
      value: data.failed,
      icon: XCircleIcon,
      color: 'text-error-600 dark:text-error-400',
      bgColor: 'bg-error-100 dark:bg-error-900/20',
    },
  ];
  
  return (
    <DashboardWidget
      title="Task Completion"
      subtitle="Overview of your task status"
      size="md"
      loading={loading}
      error={error}
    >
      <div className="flex items-center justify-between h-full">
        {/* Chart Section */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {completionRate}%
              </div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400">
                Complete
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="flex-1 ml-6 space-y-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center mr-3`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    {stat.label}
                  </span>
                </div>
                <span className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  {stat.value}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardWidget>
  );
};

export default TaskCompletionWidget;