import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../TaskCard';

const mockTask = {
  _id: 'task1',
  title: 'Test Task',
  description: 'This is a test task',
  due: new Date('2024-12-31'),
  priority: 'high',
  status: 'in-progress',
  tags: ['frontend', 'react'],
  labels: ['bug', 'urgent'],
  user: { _id: 'user1', name: 'John Doe' },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02')
};

const mockTaskWithCollaboration = {
  ...mockTask,
  assignee: { _id: 'user2', name: 'Jane Smith', avatar: null },
  project: { _id: 'project1', name: 'Web App' },
  team: { _id: 'team1', name: 'Development Team' },
  comments: [
    { _id: 'comment1', text: 'Test comment' },
    { _id: 'comment2', text: 'Another comment' }
  ]
};

describe('TaskCard', () => {
  test('renders basic task information', () => {
    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  test('shows collaboration info when enabled', () => {
    render(
      <TaskCard
        task={mockTaskWithCollaboration}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        showCollaboration={true}
      />
    );
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Web App')).toBeInTheDocument();
    expect(screen.getByText('Development Team')).toBeInTheDocument();
  });

  test('hides collaboration info when disabled', () => {
    render(
      <TaskCard
        task={mockTaskWithCollaboration}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        showCollaboration={false}
      />
    );
    
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Web App')).not.toBeInTheDocument();
  });

  test('shows comment count when comments exist', () => {
    render(
      <TaskCard
        task={mockTaskWithCollaboration}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onViewComments={jest.fn()}
        showCollaboration={true}
      />
    );
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Comment count
  });

  test('shows assign button when onAssign is provided', () => {
    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onAssign={jest.fn()}
        showCollaboration={true}
      />
    );
    
    expect(screen.getByLabelText('Assign task')).toBeInTheDocument();
  });

  test('shows comments button when onViewComments is provided', () => {
    render(
      <TaskCard
        task={mockTaskWithCollaboration}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onViewComments={jest.fn()}
        showCollaboration={true}
      />
    );
    
    expect(screen.getByLabelText('View comments')).toBeInTheDocument();
  });

  test('calls onAssign when assign button is clicked', () => {
    const onAssign = jest.fn();
    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onAssign={onAssign}
        showCollaboration={true}
      />
    );
    
    const assignButton = screen.getByLabelText('Assign task');
    fireEvent.click(assignButton);
    
    expect(onAssign).toHaveBeenCalledWith(mockTask);
  });

  test('calls onViewComments when comments button is clicked', () => {
    const onViewComments = jest.fn();
    render(
      <TaskCard
        task={mockTaskWithCollaboration}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onViewComments={onViewComments}
        showCollaboration={true}
      />
    );
    
    const commentsButton = screen.getByLabelText('View comments');
    fireEvent.click(commentsButton);
    
    expect(onViewComments).toHaveBeenCalledWith(mockTaskWithCollaboration);
  });

  test('calls onToggleComplete when checkbox is clicked', () => {
    const onToggleComplete = jest.fn();
    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={onToggleComplete}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    const checkbox = screen.getByLabelText('Mark as complete');
    fireEvent.click(checkbox);
    
    expect(onToggleComplete).toHaveBeenCalledWith('task1', true);
  });

  test('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={jest.fn()}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />
    );
    
    const editButton = screen.getByLabelText('Edit task');
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });

  test('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={onDelete}
      />
    );
    
    const deleteButton = screen.getByLabelText('Delete task');
    fireEvent.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith('task1', 'Test Task');
  });

  test('shows overdue indicator for overdue tasks', () => {
    const overdueTask = {
      ...mockTask,
      due: new Date('2023-01-01'), // Past date
      status: 'in-progress'
    };
    
    render(
      <TaskCard
        task={overdueTask}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  test('shows completed status for completed tasks', () => {
    const completedTask = {
      ...mockTask,
      status: 'completed'
    };
    
    render(
      <TaskCard
        task={completedTask}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  test('applies correct CSS classes for collaboration features', () => {
    const { container } = render(
      <TaskCard
        task={mockTaskWithCollaboration}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        showCollaboration={true}
      />
    );
    
    const taskCard = container.querySelector('.task-card');
    expect(taskCard).toHaveClass('has-assignee');
    expect(taskCard).toHaveClass('has-comments');
  });

  test('shows tags and labels', () => {
    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    expect(screen.getByText('#frontend')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  test('shows user information when showUser is true', () => {
    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        showUser={true}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});