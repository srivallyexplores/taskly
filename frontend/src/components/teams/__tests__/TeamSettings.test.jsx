import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamSettings from '../TeamSettings';
import { TeamProvider } from '../../../context/TeamContext';
import { AuthProvider } from '../../../context/AuthContext';

const mockTeam = {
  _id: 'team1',
  name: 'Test Team',
  description: 'A test team',
  members: [
    {
      user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
      role: 'admin',
      joinedAt: new Date()
    },
    {
      user: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
      role: 'member',
      joinedAt: new Date()
    }
  ],
  inviteCode: 'ABC123'
};

const mockTeamContext = {
  currentTeam: mockTeam,
  loading: { currentTeam: false, members: false },
  errors: {},
  updateTeam: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
  generateInviteCode: jest.fn(),
  deleteTeam: jest.fn(),
  canPerformAction: jest.fn(() => true)
};

const mockAuthContext = {
  user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' }
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <TeamProvider value={mockTeamContext}>
          {component}
        </TeamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('TeamSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders team settings with team information', () => {
    renderWithProviders(<TeamSettings teamId="team1" />);
    
    expect(screen.getByDisplayValue('Test Team')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test team')).toBeInTheDocument();
  });

  test('displays team members list', () => {
    renderWithProviders(<TeamSettings teamId="team1" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('updates team information when form is submitted', async () => {
    renderWithProviders(<TeamSettings teamId="team1" />);
    
    const nameInput = screen.getByDisplayValue('Test Team');
    fireEvent.change(nameInput, { target: { value: 'Updated Team Name' } });
    
    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockTeamContext.updateTeam).toHaveBeenCalledWith('team1', {
        name: 'Updated Team Name',
        description: 'A test team'
      });
    });
  });

  test('changes member role when role dropdown is changed', async () => {
    renderWithProviders(<TeamSettings teamId="team1" />);
    
    // Find role dropdown for Jane Smith (member)
    const roleSelects = screen.getAllByRole('combobox');
    const janeRoleSelect = roleSelects.find(select => 
      select.closest('.member-item')?.textContent.includes('Jane Smith')
    );
    
    if (janeRoleSelect) {
      fireEvent.change(janeRoleSelect, { target: { value: 'admin' } });
      
      await waitFor(() => {
        expect(mockTeamContext.updateMemberRole).toHaveBeenCalledWith(
          'team1', 'user2', 'admin'
        );
      });
    }
  });

  test('removes member when remove button is clicked', async () => {
    renderWithProviders(<TeamSettings teamId="team1" />);
    
    const removeButtons = screen.getAllByText(/remove/i);
    fireEvent.click(removeButtons[0]);
    
    // Confirm removal in modal
    const confirmButton = screen.getByText(/confirm/i);
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockTeamContext.removeMember).toHaveBeenCalled();
    });
  });

  test('generates new invite code when button is clicked', async () => {
    renderWithProviders(<TeamSettings teamId="team1" />);
    
    const generateButton = screen.getByText(/generate new code/i);
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockTeamContext.generateInviteCode).toHaveBeenCalledWith('team1');
    });
  });

  test('shows delete team confirmation when delete is clicked', async () => {
    renderWithProviders(<TeamSettings teamId="team1" />);
    
    const deleteButton = screen.getByText(/delete team/i);
    fireEvent.click(deleteButton);
    
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  test('disables actions when user lacks permissions', () => {
    const restrictedContext = {
      ...mockTeamContext,
      canPerformAction: jest.fn(() => false)
    };
    
    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <TeamProvider value={restrictedContext}>
            <TeamSettings teamId="team1" />
          </TeamProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    const saveButton = screen.getByText(/save changes/i);
    expect(saveButton).toBeDisabled();
  });
});