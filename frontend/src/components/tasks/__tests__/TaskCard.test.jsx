import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '../TaskCard';

const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'This is a test task',
  priority: 'high',
  status: 'todo',
  dueDate: new Date('2024-12-31'),
  tags: ['urgent', 'important'],
  assignee: {
    name: 'John Doe',
    avatar: '/avatar.jpg'
  }
};

describe('TaskCard Component', () => {
  it('renders task information correctly', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
    expect(screen.getByText('important')).toBeInTheDocument();
  });

  it('displays priority correctly', () => {
    render(<TaskCard task={mockTask} />);
    
    const priorityElement = screen.getByText(/high/i);
    expect(priorityElement).toBeInTheDocument();
    expect(priorityElement.closest('span')).toHaveClass('text-error-600');
  });

  it('shows due date', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
  });

  it('handles task completion', () => {
    const onComplete = vi.fn();
    render(<TaskCard task={mockTask} onComplete={onComplete} />);
    
    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);
    
    expect(onComplete).toHaveBeenCalledWith(mockTask.id);
  });

  it('handles task editing', () => {
    const onEdit = vi.fn();
    render(<TaskCard task={mockTask} onEdit={onEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });

  it('handles task deletion', () => {
    const onDelete = vi.fn();
    render(<TaskCard task={mockTask} onDelete={onDelete} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('shows completed state', () => {
    const completedTask = { ...mockTask, status: 'completed' };
    render(<TaskCard task={completedTask} />);
    
    const card = screen.getByTestId('task-card');
    expect(card).toHaveClass('opacity-75');
  });

  it('displays assignee information', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });

  it('handles overdue tasks', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: new Date('2020-01-01')
    };
    render(<TaskCard task={overdueTask} />);
    
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });
});