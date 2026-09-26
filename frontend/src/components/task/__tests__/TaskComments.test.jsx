import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TaskComments from '../TaskComments';
import { TeamProvider } from '../../../context/TeamContext';
import { ProjectProvider } from '../../../context/ProjectContext';
import { AuthProvider } from '../../../context/AuthContext';

const mockComments = [
  {
    _id: 'comment1',
    text: 'This is a test comment',
    author: { _id: 'user2', name: 'Jane Smith', avatar: null },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'comment2',
    text: 'Another comment with @John mention',
    author: { _id: 'user3', name: 'Alice Johnson', avatar: null },
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

const mockTeamMembers = [
  { user: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' } },
  { user: { _id: 'user3', name: 'Alice Johnson', email: 'alice@example.com' } }
];

const mockTeamContext = {
  currentTeam: {
    _id: 'team1',
    members: mockTeamMembers
  }
};

const mockProjectContext = {
  currentProject: {
    _id: 'project1',
    members: mockTeamMembers
  }
};

const mockAuthContext = {
  user: { _id: 'user1', name: 'John Doe', email: 'john@example.com', avatar: null }
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <TeamProvider value={mockTeamContext}>
          <ProjectProvider value={mockProjectContext}>
            {component}
          </ProjectProvider>
        </TeamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('TaskComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders comments list', () => {
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={mockComments}
        onAddComment={jest.fn()}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('Another comment with @John mention')).toBeInTheDocument();
  });

  test('shows empty state when no comments', () => {
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={[]}
        onAddComment={jest.fn()}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    expect(screen.getByText('No comments yet. Start the conversation!')).toBeInTheDocument();
  });

  test('allows adding new comment', async () => {
    const onAddComment = jest.fn();
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={[]}
        onAddComment={onAddComment}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    const textarea = screen.getByPlaceholderText(/add a comment/i);
    fireEvent.change(textarea, { target: { value: 'New test comment' } });
    
    const submitButton = screen.getByText('Comment');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('task1', {
        text: 'New test comment',
        mentions: []
      });
    });
  });

  test('handles mentions in comments', async () => {
    const onAddComment = jest.fn();
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={[]}
        onAddComment={onAddComment}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    const textarea = screen.getByPlaceholderText(/add a comment/i);
    fireEvent.change(textarea, { target: { value: 'Hey @Jane, check this out!' } });
    
    const submitButton = screen.getByText('Comment');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('task1', {
        text: 'Hey @Jane, check this out!',
        mentions: expect.arrayContaining(['user2']) // Jane's user ID
      });
    });
  });

  test('shows mention dropdown when typing @', async () => {
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={[]}
        onAddComment={jest.fn()}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    const textarea = screen.getByPlaceholderText(/add a comment/i);
    
    // Simulate typing @
    fireEvent.change(textarea, { target: { value: '@' } });
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  test('filters mentions based on query', async () => {
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={[]}
        onAddComment={jest.fn()}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    const textarea = screen.getByPlaceholderText(/add a comment/i);
    
    // Simulate typing @jane
    fireEvent.change(textarea, { target: { value: '@jane' } });
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });
  });

  test('allows editing own comments', () => {
    const commentsWithOwnComment = [
      {
        _id: 'comment1',
        text: 'My comment',
        author: { _id: 'user1', name: 'John Doe', avatar: null },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
    
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={commentsWithOwnComment}
        onAddComment={jest.fn()}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    // Should show edit/delete options for own comment
    expect(screen.getByLabelText(/more options/i)).toBeInTheDocument();
  });

  test('does not show edit options for other users comments', () => {
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={mockComments}
        onAddComment={jest.fn()}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    // Should not show edit/delete options for other users' comments
    expect(screen.queryByLabelText(/more options/i)).not.toBeInTheDocument();
  });

  test('handles comment deletion', async () => {
    const onDeleteComment = jest.fn();
    const commentsWithOwnComment = [
      {
        _id: 'comment1',
        text: 'My comment',
        author: { _id: 'user1', name: 'John Doe', avatar: null },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
    
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={commentsWithOwnComment}
        onAddComment={jest.fn()}
        onUpdateComment={jest.fn()}
        onDeleteComment={onDeleteComment}
        teamId="team1"
      />
    );
    
    // Click dropdown and delete
    const moreButton = screen.getByLabelText(/more options/i);
    fireEvent.click(moreButton);
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(onDeleteComment).toHaveBeenCalledWith('comment1');
    });
  });

  test('supports keyboard shortcuts', async () => {
    const onAddComment = jest.fn();
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={[]}
        onAddComment={onAddComment}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    const textarea = screen.getByPlaceholderText(/add a comment/i);
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    
    // Simulate Ctrl+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('task1', {
        text: 'Test comment',
        mentions: []
      });
    });
  });

  test('renders mentions in comment text', () => {
    const commentWithMention = [
      {
        _id: 'comment1',
        text: 'Hey @Jane, check this out!',
        author: { _id: 'user2', name: 'Jane Smith', avatar: null },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
    
    renderWithProviders(
      <TaskComments
        taskId="task1"
        comments={commentWithMention}
        onAddComment={jest.fn()}
        onUpdateComment={jest.fn()}
        onDeleteComment={jest.fn()}
        teamId="team1"
      />
    );
    
    // Should highlight the mention
    expect(screen.getByText('@Jane')).toHaveClass('bg-primary-100');
  });
});