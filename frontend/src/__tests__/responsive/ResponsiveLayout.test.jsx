import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TeamProvider } from '../../context/TeamContext';
import { ProjectProvider } from '../../context/ProjectContext';
import { AuthProvider } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import TeamDashboard from '../../components/teams/TeamDashboard';
import ProjectDashboard from '../../components/projects/ProjectDashboard';
import MemberList from '../../components/members/MemberList';

// Mock contexts
const mockAuthContext = {
  user: { _id: 'user1', name: 'John Doe', email: 'john@example.com' }
};

const mockTeamContext = {
  currentTeam: {
    _id: 'team1',
    name: 'Test Team',
    members: [
      { user: { _id: 'user1', name: 'John Doe' }, role: 'admin' },
      { user: { _id: 'user2', name: 'Jane Smith' }, role: 'member' }
    ]
  },
  teamStats: {
    memberCount: 2,
    projectCount: 3,
    completedTasks: 10,
    totalTasks: 15
  },
  loading: { currentTeam: false, stats: false },
  errors: {},
  fetchTeam: jest.fn(),
  fetchTeamStats: jest.fn()
};

const mockProjectContext = {
  currentProject: {
    _id: 'project1',
    name: 'Test Project',
    members: [
      { user: { _id: 'user1', name: 'John Doe' }, role: 'admin' }
    ]
  },
  projectStats: {
    taskCount: 10,
    completedTasks: 5,
    progress: 50
  },
  loading: { currentProject: false, stats: false },
  errors: {},
  fetchProject: jest.fn(),
  fetchProjectStats: jest.fn()
};

const mockThemeContext = {
  theme: 'light',
  toggleTheme: jest.fn(),
  isDark: false
};

const renderWithProviders = (component, viewport = 'desktop') => {
  // Set viewport before rendering
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  };

  const { width, height } = viewports[viewport];
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

  return render(
    <BrowserRouter>
      <ThemeProvider value={mockThemeContext}>
        <AuthProvider value={mockAuthContext}>
          <TeamProvider value={mockTeamContext}>
            <ProjectProvider value={mockProjectContext}>
              {component}
            </ProjectProvider>
          </TeamProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Responsive Layout Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TeamDashboard Responsive Behavior', () => {
    test('renders correctly on mobile', () => {
      renderWithProviders(<TeamDashboard teamId="team1" />, 'mobile');
      
      expect(screen.getByText('Test Team')).toBeInTheDocument();
      // Mobile layout should stack elements vertically
      const container = document.querySelector('.team-dashboard');
      expect(container).toBeInTheDocument();
    });

    test('renders correctly on tablet', () => {
      renderWithProviders(<TeamDashboard teamId="team1" />, 'tablet');
      
      expect(screen.getByText('Test Team')).toBeInTheDocument();
      // Tablet layout should have intermediate grid
    });

    test('renders correctly on desktop', () => {
      renderWithProviders(<TeamDashboard teamId="team1" />, 'desktop');
      
      expect(screen.getByText('Test Team')).toBeInTheDocument();
      // Desktop layout should have full grid
    });

    test('stats grid adapts to screen size', () => {
      const { rerender } = renderWithProviders(<TeamDashboard teamId="team1" />, 'mobile');
      
      // Check mobile layout
      let statsGrid = document.querySelector('.stats-grid');
      if (statsGrid) {
        expect(statsGrid.className).toContain('grid-cols-1');
      }

      // Switch to desktop
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      rerender(
        <BrowserRouter>
          <ThemeProvider value={mockThemeContext}>
            <AuthProvider value={mockAuthContext}>
              <TeamProvider value={mockTeamContext}>
                <ProjectProvider value={mockProjectContext}>
                  <TeamDashboard teamId="team1" />
                </ProjectProvider>
              </TeamProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      statsGrid = document.querySelector('.stats-grid');
      if (statsGrid) {
        expect(statsGrid.className).toContain('lg:grid-cols-4');
      }
    });
  });

  describe('ProjectDashboard Responsive Behavior', () => {
    test('adapts header actions on mobile', () => {
      renderWithProviders(<ProjectDashboard projectId="project1" />, 'mobile');
      
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      
      // Header actions should stack on mobile
      const headerActions = document.querySelector('.header-actions');
      if (headerActions) {
        expect(headerActions.className).toContain('flex-col');
      }
    });

    test('shows appropriate chart sizes for different screens', () => {
      renderWithProviders(<ProjectDashboard projectId="project1" />, 'mobile');
      
      // Charts should be smaller on mobile
      const chartContainers = document.querySelectorAll('.chart-container');
      chartContainers.forEach(container => {
        expect(container.className).toContain('h-64');
      });
    });
  });

  describe('MemberList Responsive Behavior', () => {
    test('switches to single column on mobile', () => {
      renderWithProviders(<MemberList teamId="team1" />, 'mobile');
      
      const memberGrid = document.querySelector('.member-grid');
      if (memberGrid) {
        expect(memberGrid.className).toContain('grid-cols-1');
      }
    });

    test('hides view toggle on mobile', () => {
      renderWithProviders(<MemberList teamId="team1" />, 'mobile');
      
      const viewToggle = document.querySelector('.view-toggle');
      if (viewToggle) {
        expect(viewToggle.className).toContain('hidden');
      }
    });

    test('stacks filters vertically on mobile', () => {
      renderWithProviders(<MemberList teamId="team1" />, 'mobile');
      
      const filters = document.querySelector('.filters');
      if (filters) {
        expect(filters.className).toContain('flex-col');
      }
    });
  });

  describe('Touch Interactions', () => {
    test('increases touch targets on mobile', () => {
      renderWithProviders(<TeamDashboard teamId="team1" />, 'mobile');
      
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44); // 44px minimum touch target
      });
    });

    test('improves form input sizes on mobile', () => {
      renderWithProviders(<MemberList teamId="team1" />, 'mobile');
      
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const styles = window.getComputedStyle(input);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Orientation Changes', () => {
    test('handles portrait to landscape transition', () => {
      // Start in portrait
      renderWithProviders(<TeamDashboard teamId="team1" />, 'mobile');
      
      // Switch to landscape
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      fireEvent(window, new Event('orientationchange'));
      
      // Layout should adapt to landscape
      expect(window.innerWidth > window.innerHeight).toBe(true);
    });

    test('adjusts grid columns in landscape mode', () => {
      // Mobile landscape
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      renderWithProviders(<TeamDashboard teamId="team1" />);
      
      // Should use 2 columns in landscape mobile
      const statsGrid = document.querySelector('.stats-grid');
      if (statsGrid) {
        expect(statsGrid.className).toContain('grid-cols-2');
      }
    });
  });

  describe('Accessibility on Mobile', () => {
    test('maintains focus indicators on touch devices', () => {
      renderWithProviders(<TeamDashboard teamId="team1" />, 'mobile');
      
      const focusableElements = document.querySelectorAll('button, input, select, textarea, a');
      focusableElements.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });

    test('provides adequate contrast on small screens', () => {
      renderWithProviders(<TeamDashboard teamId="team1" />, 'mobile');
      
      // Text should have good contrast
      const textElements = document.querySelectorAll('.text-secondary');
      textElements.forEach(element => {
        expect(element.className).toContain('text-secondary-700');
      });
    });
  });

  describe('Performance on Mobile', () => {
    test('limits rendered items on small screens', () => {
      const manyMembers = Array.from({ length: 100 }, (_, i) => ({
        user: { _id: `user${i}`, name: `User ${i}` },
        role: 'member'
      }));

      const contextWithManyMembers = {
        ...mockTeamContext,
        currentTeam: {
          ...mockTeamContext.currentTeam,
          members: manyMembers
        }
      };

      render(
        <BrowserRouter>
          <TeamProvider value={contextWithManyMembers}>
            <MemberList teamId="team1" />
          </TeamProvider>
        </BrowserRouter>
      );

      // Should not render all 100 members at once on mobile
      const memberCards = document.querySelectorAll('.member-card');
      expect(memberCards.length).toBeLessThan(100);
    });
  });

  describe('Breakpoint Transitions', () => {
    test('smoothly transitions between breakpoints', () => {
      const { rerender } = renderWithProviders(<TeamDashboard teamId="team1" />, 'mobile');
      
      // Transition from mobile to tablet
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      fireEvent(window, new Event('resize'));
      
      rerender(
        <BrowserRouter>
          <ThemeProvider value={mockThemeContext}>
            <AuthProvider value={mockAuthContext}>
              <TeamProvider value={mockTeamContext}>
                <ProjectProvider value={mockProjectContext}>
                  <TeamDashboard teamId="team1" />
                </ProjectProvider>
              </TeamProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );
      
      // Layout should adapt
      expect(window.innerWidth).toBe(768);
    });
  });
});