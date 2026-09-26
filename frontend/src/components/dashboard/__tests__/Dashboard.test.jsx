import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../Dashboard';

// Mock the chart components
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Doughnut: ({ data, options }) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Bar: ({ data, options }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} />
  )
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>
  },
  AnimatePresence: ({ children }) => children
}));

const mockDashboardData = {
  stats: {
    totalTasks: 45,
    completedTasks: 32,
    pendingTasks: 13,
    overdueTasks: 3,
    completionRate: 71
  },
  recentTasks: [
    {
      id: '1',
      title: 'Complete project proposal',
      status: 'completed',
      priority: 'high',
      dueDate: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Review design mockups',
      status: 'in-progress',
      priority: 'medium',
      dueDate: new Date('2024-01-20')
    }
  ],
  productivityData: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Tasks Completed',
      data: [5, 8, 6, 12, 9, 3, 1],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }]
  }
};

describe('Dashboard Component', () => {
  it('renders dashboard stats correctly', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText('32')).toBeInTheDocument(); // Completed tasks
      expect(screen.getByText('13')).toBeInTheDocument(); // Pending tasks
      expect(screen.getByText('71%')).toBeInTheDocument(); // Completion rate
    });
  });

  it('displays recent tasks', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Tasks')).toBeInTheDocument();
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      expect(screen.getByText('Review design mockups')).toBeInTheDocument();
    });
  });

  it('renders productivity chart', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('shows welcome message', () => {
    render(<Dashboard />);
    
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('displays quick actions', () => {
    render(<Dashboard />);
    
    expect(screen.getByText(/create task/i)).toBeInTheDocument();
    expect(screen.getByText(/view all tasks/i)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<Dashboard loading={true} />);
    
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('handles error state', () => {
    const error = 'Failed to load dashboard data';
    render(<Dashboard error={error} />);
    
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('shows empty state when no tasks', async () => {
    const emptyData = { ...mockDashboardData, recentTasks: [] };
    render(<Dashboard data={emptyData} />);
    
    await waitFor(() => {
      expect(screen.getByText(/no recent tasks/i)).toBeInTheDocument();
    });
  });
});