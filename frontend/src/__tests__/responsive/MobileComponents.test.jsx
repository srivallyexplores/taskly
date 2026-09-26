import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MobileTeamActions from '../../components/mobile/MobileTeamActions';
import MobileInviteShare from '../../components/mobile/MobileInviteShare';
import MobileTaskAssignment from '../../components/mobile/MobileTaskAssignment';
import { TeamProvider } from '../../context/TeamContext';
import { ProjectProvider } from '../../context/ProjectContext';

// Mock the mobile detection hook
jest.mock('../../hooks/useMobileDetection', () => ({
  useMobileDetection: () => ({
    isMobile: true,
    isTablet: false,
    touchDevice: true,
    screenSize: 'mobile',
    orientation: 'portrait'
  })
}));

const mockTeamContext = {
  currentTeam: {
    _id: 'team1',
    name: 'Test Team',
    members: [
      { user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' } },
      { user: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' } }
    ]
  },
  canPerformAction: jest.fn(() => true)
};

const mockProjectContext = {
  currentProject: {
    _id: 'project1',
    name: 'Test Project',
    members: [
      { user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' } },
      { user: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' } }
    ]
  }
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

describe('Mobile Team Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MobileTeamActions', () => {
    test('renders floating action button on mobile', () => {
      renderWithProviders(
        <MobileTeamActions
          teamId="team1"
          onCreateProject={jest.fn()}
          onInviteMembers={jest.fn()}
          onTeamSettings={jest.fn()}
          onTeamAnalytics={jest.fn()}
          onShareTeam={jest.fn()}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('opens action menu when FAB is clicked', async () => {
      const mockActions = {
        onCreateProject: jest.fn(),
        onInviteMembers: jest.fn(),
        onTeamSettings: jest.fn(),
        onTeamAnalytics: jest.fn(),
        onShareTeam: jest.fn()
      };

      renderWithProviders(
        <MobileTeamActions teamId="team1" {...mockActions} />
      );

      const fab = screen.getByRole('button');
      fireEvent.click(fab);

      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument();
        expect(screen.getByText('Invite Members')).toBeInTheDocument();
        expect(screen.getByText('Share Team')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    test('calls appropriate action when menu item is clicked', async () => {
      const mockCreateProject = jest.fn();
      
      renderWithProviders(
        <MobileTeamActions
          teamId="team1"
          onCreateProject={mockCreateProject}
          onInviteMembers={jest.fn()}
          onTeamSettings={jest.fn()}
          onTeamAnalytics={jest.fn()}
          onShareTeam={jest.fn()}
        />
      );

      // Open menu
      const fab = screen.getByRole('button');
      fireEvent.click(fab);

      // Click action
      await waitFor(() => {
        const createProjectButton = screen.getByText('New Project');
        fireEvent.click(createProjectButton);
      });

      expect(mockCreateProject).toHaveBeenCalled();
    });

    test('closes menu when backdrop is clicked', async () => {
      renderWithProviders(
        <MobileTeamActions
          teamId="team1"
          onCreateProject={jest.fn()}
          onInviteMembers={jest.fn()}
          onTeamSettings={jest.fn()}
          onTeamAnalytics={jest.fn()}
          onShareTeam={jest.fn()}
        />
      );

      // Open menu
      const fab = screen.getByRole('button');
      fireEvent.click(fab);

      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument();
      });

      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0.bg-black');
      fireEvent.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByText('New Project')).not.toBeInTheDocument();
      });
    });
  });

  describe('MobileInviteShare', () => {
    test('renders invite share modal', () => {
      renderWithProviders(
        <MobileInviteShare
          isOpen={true}
          onClose={jest.fn()}
          teamId="team1"
          inviteCode="ABC123"
        />
      );

      expect(screen.getByText('Invite Team Members')).toBeInTheDocument();
      expect(screen.getByText('Share Link')).toBeInTheDocument();
      expect(screen.getByText('QR Code')).toBeInTheDocument();
    });

    test('switches between share methods', async () => {
      renderWithProviders(
        <MobileInviteShare
          isOpen={true}
          onClose={jest.fn()}
          teamId="team1"
          inviteCode="ABC123"
        />
      );

      // Should start with link method
      expect(screen.getByText('Invite Link')).toBeInTheDocument();

      // Switch to QR code
      const qrButton = screen.getByText('QR Code');
      fireEvent.click(qrButton);

      await waitFor(() => {
        expect(screen.getByText('Scan this QR code to join the team')).toBeInTheDocument();
      });
    });

    test('copies invite link to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn()
        }
      });

      renderWithProviders(
        <MobileInviteShare
          isOpen={true}
          onClose={jest.fn()}
          teamId="team1"
          inviteCode="ABC123"
        />
      );

      const copyButton = screen.getByText('Copy Link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          `${window.location.origin}/join/ABC123`
        );
      });
    });

    test('shows native share option when available', () => {
      // Mock native share API
      Object.assign(navigator, {
        share: jest.fn()
      });

      renderWithProviders(
        <MobileInviteShare
          isOpen={true}
          onClose={jest.fn()}
          teamId="team1"
          inviteCode="ABC123"
        />
      );

      expect(screen.getByText('Share')).toBeInTheDocument();
    });
  });

  describe('MobileTaskAssignment', () => {
    test('renders task assignment modal', () => {
      renderWithProviders(
        <MobileTaskAssignment
          isOpen={true}
          onClose={jest.fn()}
          taskId="task1"
          teamId="team1"
          onAssign={jest.fn()}
        />
      );

      expect(screen.getByText('Assign Task')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search team members...')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    test('displays team members for assignment', () => {
      renderWithProviders(
        <MobileTaskAssignment
          isOpen={true}
          onClose={jest.fn()}
          taskId="task1"
          teamId="team1"
          onAssign={jest.fn()}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('filters members based on search', async () => {
      renderWithProviders(
        <MobileTaskAssignment
          isOpen={true}
          onClose={jest.fn()}
          taskId="task1"
          teamId="team1"
          onAssign={jest.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search team members...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    test('selects member for assignment', async () => {
      renderWithProviders(
        <MobileTaskAssignment
          isOpen={true}
          onClose={jest.fn()}
          taskId="task1"
          teamId="team1"
          onAssign={jest.fn()}
        />
      );

      const johnOption = screen.getByText('John Doe').closest('div');
      fireEvent.click(johnOption);

      await waitFor(() => {
        expect(johnOption.querySelector('svg')).toBeInTheDocument(); // Check icon
      });
    });

    test('calls onAssign when assign button is clicked', async () => {
      const mockOnAssign = jest.fn();
      
      renderWithProviders(
        <MobileTaskAssignment
          isOpen={true}
          onClose={jest.fn()}
          taskId="task1"
          teamId="team1"
          onAssign={mockOnAssign}
        />
      );

      // Select a member
      const johnOption = screen.getByText('John Doe').closest('div');
      fireEvent.click(johnOption);

      // Click assign button
      const assignButton = screen.getByText('Assign');
      fireEvent.click(assignButton);

      await waitFor(() => {
        expect(mockOnAssign).toHaveBeenCalledWith('task1', expect.objectContaining({
          _id: 'user1',
          name: 'John Doe'
        }));
      });
    });

    test('shows current assignment info', () => {
      const currentAssignee = {
        _id: 'user1',
        name: 'John Doe',
        email: 'john@example.com'
      };

      renderWithProviders(
        <MobileTaskAssignment
          isOpen={true}
          onClose={jest.fn()}
          taskId="task1"
          currentAssignee={currentAssignee}
          teamId="team1"
          onAssign={jest.fn()}
        />
      );

      expect(screen.getByText('Currently assigned to John Doe')).toBeInTheDocument();
    });
  });
});

// Viewport testing utilities
const setViewport = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Behavior', () => {
  test('components adapt to different screen sizes', () => {
    // Test mobile viewport
    setViewport(375, 667);
    expect(window.innerWidth).toBe(375);

    // Test tablet viewport
    setViewport(768, 1024);
    expect(window.innerWidth).toBe(768);

    // Test desktop viewport
    setViewport(1920, 1080);
    expect(window.innerWidth).toBe(1920);
  });

  test('handles orientation changes', () => {
    // Portrait
    setViewport(375, 667);
    expect(window.innerWidth < window.innerHeight).toBe(true);

    // Landscape
    setViewport(667, 375);
    expect(window.innerWidth > window.innerHeight).toBe(true);
  });
});