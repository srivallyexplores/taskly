import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InviteModal from '../InviteModal';
import { TeamProvider } from '../../../context/TeamContext';
import { ProjectProvider } from '../../../context/ProjectContext';

const mockTeamContext = {
  currentTeam: {
    _id: 'team1',
    name: 'Test Team',
    inviteCode: 'ABC123'
  },
  generateInviteCode: jest.fn(),
  inviteMembers: jest.fn(),
  loading: { inviteMembers: false }
};

const mockProjectContext = {
  currentProject: {
    _id: 'project1',
    name: 'Test Project'
  },
  inviteMembers: jest.fn(),
  loading: { inviteMembers: false }
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <TeamProvider value={mockTeamContext}>
        <ProjectProvider value={mockProjectContext}>
          {component}
        </ProjectProvider>
      </TeamProvider>
    </BrowserRouter>
  );
};

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
  }
});

describe('InviteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders invite modal with email method selected by default', () => {
    renderWithProviders(
      <InviteModal isOpen={true} onClose={jest.fn()} teamId="team1" />
    );
    
    expect(screen.getByText('Invite to Team')).toBeInTheDocument();
    expect(screen.getByText('Email Invites')).toBeInTheDocument();
    expect(screen.getByText('Invite Link')).toBeInTheDocument();
  });

  test('switches between email and link invite methods', () => {
    renderWithProviders(
      <InviteModal isOpen={true} onClose={jest.fn()} teamId="team1" />
    );
    
    const linkButton = screen.getByText('Invite Link');
    fireEvent.click(linkButton);
    
    expect(screen.getByText('Invite Link')).toBeInTheDocument();
  });

  test('adds and removes email fields', () => {
    renderWithProviders(
      <InviteModal isOpen={true} onClose={jest.fn()} teamId="team1" />
    );
    
    // Add another email field
    const addButton = screen.getByText(/add another email/i);
    fireEvent.click(addButton);
    
    const emailInputs = screen.getAllByPlaceholderText(/enter email address/i);
    expect(emailInputs).toHaveLength(2);
    
    // Remove email field (if there are multiple)
    const removeButtons = screen.getAllByRole('button');
    const trashButton = removeButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('w-5')
    );
    
    if (trashButton) {
      fireEvent.click(trashButton);
    }
  });

  test('updates email and role values', () => {
    renderWithProviders(
      <InviteModal isOpen={true} onClose={jest.fn()} teamId="team1" />
    );
    
    const emailInput = screen.getByPlaceholderText(/enter email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput.value).toBe('test@example.com');
    
    const roleSelect = screen.getByDisplayValue('Member');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    
    expect(roleSelect.value).toBe('admin');
  });

  test('sends email invites when form is submitted', async () => {
    renderWithProviders(
      <InviteModal isOpen={true} onClose={jest.fn()} teamId="team1" />
    );
    
    // Fill in email
    const emailInput = screen.getByPlaceholderText(/enter email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Add message
    const messageInput = screen.getByPlaceholderText(/add a personal message/i);
    fireEvent.change(messageInput, { target: { value: 'Welcome to the team!' } });
    
    // Submit
    const sendButton = screen.getByText(/send invites/i);
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockTeamContext.inviteMembers).toHaveBeenCalledWith('team1', {
        invites: [{ email: 'test@example.com', role: 'member' }],
        message: 'Welcome to the team!'
      });
    });
  });

  test('generates invite code for link method', async () => {
    renderWithProviders(
      <InviteModal isOpen={true} onClose={jest.fn()} teamId="team1" />
    );
    
    // Switch to link method
    const linkButton = screen.getByText('Invite Link');
    fireEvent.click(linkButton);
    
    // Should show existing invite code
    expect(screen.getByText(/ABC123/)).toBeInTheDocument();
    
    // Generate new code
    const generateButton = screen.getByText(/generate new link/i);
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockTeamContext.generateInviteCode).toHaveBeenCalledWith('team1');
    });
  });

  test('copies invite link to clipboard', async () => {
    renderWithProviders(
      <InviteModal isOpen={true} onClose={jest.fn()} teamId="team1" />
    );
    
    // Switch to link method
    const linkButton = screen.getByText('Invite Link');
    fireEvent.click(linkButton);
    
    // Copy link
    const copyButton = screen.getByText(/copy link/i);
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/join/ABC123`
      );
    });
    
    // Should show "Copied!" feedback
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  test('validates email addresses before sending', () => {
    renderWithProviders(
      <InviteModal isOpen={true} onClose={jest.fn()} teamId="team1" />
    );
    
    // Try to send without valid email
    const sendButton = screen.getByText(/send invites \(0\)/i);
    expect(sendButton).toBeDisabled();
    
    // Add valid email
    const emailInput = screen.getByPlaceholderText(/enter email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Button should now be enabled
    const enabledButton = screen.getByText(/send invites \(1\)/i);
    expect(enabledButton).not.toBeDisabled();
  });

  test('shows loading state when sending invites', async () => {
    const loadingContext = {
      ...mockTeamContext,
      loading: { inviteMembers: true }
    };
    
    render(
      <BrowserRouter>
        <TeamProvider value={loadingContext}>
          <ProjectProvider value={mockProjectContext}>
            <InviteModal isOpen={true} onClose={jest.fn()} teamId="team1" />
          </ProjectProvider>
        </TeamProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('closes modal when cancel is clicked', () => {
    const onClose = jest.fn();
    renderWithProviders(
      <InviteModal isOpen={true} onClose={onClose} teamId="team1" />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  test('shows project invite modal title', () => {
    renderWithProviders(
      <InviteModal isOpen={true} onClose={jest.fn()} projectId="project1" />
    );
    
    expect(screen.getByText('Invite to Project')).toBeInTheDocument();
  });
});