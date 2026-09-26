import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { TeamProvider } from '../../context/TeamContext';
import { ProjectProvider } from '../../context/ProjectContext';
import { ThemeProvider } from '../../context/ThemeContext';
import Navigation from '../../components/layout/Navigation';

const mockAuthContext = {
  user: { 
    _id: 'user1', 
    name: 'John Doe', 
    email: 'john@example.com',
    fullname: 'John Doe',
    username: 'johndoe',
    avatar: null
  },
  isAuthenticated: true,
  loading: false
};

const mockTeamContext = {
  teams: [
    { _id: 'team1', name: 'Development Team' },
    { _id: 'team2', name: 'Design Team' },
    { _id: 'team3', name: 'Marketing Team' },
    { _id: 'team4', name: 'Sales Team' },
    { _id: 'team5', name: 'Support Team' },
    { _id: 'team6', name: 'HR Team' }
  ],
  currentTeam: null,
  loading: { teams: false },
  errors: {}
};

const mockProjectContext = {
  projects: [
    { _id: 'project1', name: 'Web Application' },
    { _id: 'project2', name: 'Mobile App' },
    { _id: 'project3', name: 'API Service' },
    { _id: 'project4', name: 'Dashboard' },
    { _id: 'project5', name: 'Analytics' },
    { _id: 'project6', name: 'Reporting' }
  ],
  loading: { projects: false },
  errors: {}
};

const mockThemeContext = {
  theme: 'light',
  toggleTheme: jest.fn(),
  getThemeIcon: jest.fn(() => 'sun'),
  getThemeLabel: jest.fn(() => 'Light'),
  isDark: false
};

const renderWithProviders = (initialEntries = ['/dashboard']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider value={mockThemeContext}>
        <AuthProvider value={mockAuthContext}>
          <TeamProvider value={mockTeamContext}>
            <ProjectProvider value={mockProjectContext}>
              <Navigation />
            </ProjectProvider>
          </TeamProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders main navigation items', () => {
    renderWithProviders();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('renders teams section with expand/collapse', async () => {
    renderWithProviders();
    
    const teamsHeader = screen.getByText('Teams');
    expect(teamsHeader).toBeInTheDocument();
    
    // Click to expand teams
    fireEvent.click(teamsHeader);
    
    await waitFor(() => {
      expect(screen.getByText('All Teams')).toBeInTheDocument();
      expect(screen.getByText('Development Team')).toBeInTheDocument();
      expect(screen.getByText('Design Team')).toBeInTheDocument();
    });
  });

  test('renders projects section with expand/collapse', async () => {
    renderWithProviders();
    
    const projectsHeader = screen.getByText('Projects');
    expect(projectsHeader).toBeInTheDocument();
    
    // Click to expand projects
    fireEvent.click(projectsHeader);
    
    await waitFor(() => {
      expect(screen.getByText('All Projects')).toBeInTheDocument();
      expect(screen.getByText('Web Application')).toBeInTheDocument();
      expect(screen.getByText('Mobile App')).toBeInTheDocument();
    });
  });

  test('shows limited teams in navigation with more indicator', async () => {
    renderWithProviders();
    
    // Expand teams section
    const teamsHeader = screen.getByText('Teams');
    fireEvent.click(teamsHeader);
    
    await waitFor(() => {
      // Should show first 5 teams plus "more" indicator
      expect(screen.getByText('Development Team')).toBeInTheDocument();
      expect(screen.getByText('Design Team')).toBeInTheDocument();
      expect(screen.getByText('Marketing Team')).toBeInTheDocument();
      expect(screen.getByText('Sales Team')).toBeInTheDocument();
      expect(screen.getByText('Support Team')).toBeInTheDocument();
      expect(screen.getByText('+1 more teams')).toBeInTheDocument();
    });
  });

  test('shows limited projects in navigation with more indicator', async () => {
    renderWithProviders();
    
    // Expand projects section
    const projectsHeader = screen.getByText('Projects');
    fireEvent.click(projectsHeader);
    
    await waitFor(() => {
      // Should show first 5 projects plus "more" indicator
      expect(screen.getByText('Web Application')).toBeInTheDocument();
      expect(screen.getByText('Mobile App')).toBeInTheDocument();
      expect(screen.getByText('API Service')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('+1 more projects')).toBeInTheDocument();
    });
  });

  test('highlights active navigation item', () => {
    renderWithProviders(['/tasks']);
    
    const tasksLink = screen.getByText('Tasks').closest('a');
    expect(tasksLink).toHaveClass('bg-primary-100');
  });

  test('renders user profile section', () => {
    renderWithProviders();
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
  });

  test('renders theme toggle button', () => {
    renderWithProviders();
    
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  test('toggles theme when theme button is clicked', () => {
    renderWithProviders();
    
    const themeButton = screen.getByText('Light');
    fireEvent.click(themeButton);
    
    expect(mockThemeContext.toggleTheme).toHaveBeenCalled();
  });

  test('renders mobile navigation', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    renderWithProviders();
    
    // Mobile menu should be present but hidden initially
    const mobileMenuButton = screen.getByRole('button');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  test('opens mobile menu when hamburger is clicked', async () => {
    renderWithProviders();
    
    // Find and click the mobile menu button (hamburger)
    const menuButtons = screen.getAllByRole('button');
    const hamburgerButton = menuButtons.find(button => 
      button.querySelector('svg')?.classList.contains('w-5')
    );
    
    if (hamburgerButton) {
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        // Mobile menu should be visible
        expect(screen.getAllByText('Dashboard')).toHaveLength(2); // Desktop + mobile
      });
    }
  });

  test('navigates to team when team link is clicked', async () => {
    renderWithProviders();
    
    // Expand teams section
    const teamsHeader = screen.getByText('Teams');
    fireEvent.click(teamsHeader);
    
    await waitFor(() => {
      const teamLink = screen.getByText('Development Team');
      fireEvent.click(teamLink);
      
      // Should navigate to team page
      expect(window.location.pathname).toBe('/teams/team1');
    });
  });

  test('navigates to project when project link is clicked', async () => {
    renderWithProviders();
    
    // Expand projects section
    const projectsHeader = screen.getByText('Projects');
    fireEvent.click(projectsHeader);
    
    await waitFor(() => {
      const projectLink = screen.getByText('Web Application');
      fireEvent.click(projectLink);
      
      // Should navigate to project page
      expect(window.location.pathname).toBe('/projects/project1');
    });
  });

  test('renders bottom navigation on mobile', () => {
    renderWithProviders();
    
    // Bottom navigation should be present
    const bottomNav = document.querySelector('.lg\\:hidden.fixed.bottom-0');
    expect(bottomNav).toBeInTheDocument();
  });

  test('shows active indicator in bottom navigation', () => {
    renderWithProviders(['/tasks']);
    
    const bottomNav = document.querySelector('.lg\\:hidden.fixed.bottom-0');
    const tasksItem = bottomNav?.querySelector('a[href="/tasks"]');
    
    expect(tasksItem).toHaveClass('text-primary-600');
  });
});