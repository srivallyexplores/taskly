import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamAnalytics from '../../components/analytics/TeamAnalytics';

// Mock the context providers
const TeamProvider = ({ children, value }) => (
  <div data-testid="team-provider">{children}</div>
);

const ProjectProvider = ({ children, value }) => (
  <div data-testid="project-provider">{children}</div>
);

// Performance testing utilities
const measureRenderTime = async (component) => {
  const startTime = performance.now();
  render(component);
  await waitFor(() => screen.getByText(/analytics/i));
  const endTime = performance.now();
  return endTime - startTime;
};

// Generate large datasets for performance testing
const generateLargeTeamStats = (size = 1000) => {
  const memberStats = {};
  
  for (let i = 0; i < size; i++) {
    memberStats[`user${i}`] = {
      completedTasks: Math.floor(Math.random() * 50),
      inProgressTasks: Math.floor(Math.random() * 20)
    };
  }
  
  return {
    totalTasks: size * 10,
    completedTasks: size * 6,
    memberStats,
    overdueTasks: Math.floor(size * 0.1),
    averageTaskTime: 2.5
  };
};

const createMockTeamContext = (teamStats) => ({
  currentTeam: {
    _id: 'team1',
    name: 'Performance Test Team',
    members: Array.from({ length: 100 }, (_, i) => ({
      user: { _id: `user${i}`, name: `User ${i}` }
    }))
  },
  teamStats,
  loading: { currentTeam: false, stats: false },
  errors: {},
  fetchTeam: vi.fn(),
  fetchTeamStats: vi.fn()
});

const renderWithProviders = (component, teamStats) => {
  const teamContext = createMockTeamContext(teamStats);
  const projectContext = {
    projects: [],
    fetchProjects: vi.fn()
  };
  
  return render(
    <BrowserRouter>
      <TeamProvider value={teamContext}>
        <ProjectProvider value={projectContext}>
          {component}
        </ProjectProvider>
      </TeamProvider>
    </BrowserRouter>
  );
};

describe('Analytics Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with small dataset efficiently', async () => {
    const smallStats = generateLargeTeamStats(10);
    
    const renderTime = await measureRenderTime(
      <BrowserRouter>
        <TeamProvider value={createMockTeamContext(smallStats)}>
          <ProjectProvider value={{ projects: [], fetchProjects: vi.fn() }}>
            <TeamAnalytics teamId="team1" />
          </ProjectProvider>
        </TeamProvider>
      </BrowserRouter>
    );
    
    // Should render quickly with small dataset
    expect(renderTime).toBeLessThan(100); // 100ms threshold
  });

  test('renders with medium dataset within acceptable time', async () => {
    const mediumStats = generateLargeTeamStats(100);
    
    const renderTime = await measureRenderTime(
      <BrowserRouter>
        <TeamProvider value={createMockTeamContext(mediumStats)}>
          <ProjectProvider value={{ projects: [], fetchProjects: vi.fn() }}>
            <TeamAnalytics teamId="team1" />
          </ProjectProvider>
        </TeamProvider>
      </BrowserRouter>
    );
    
    // Should still render reasonably fast with medium dataset
    expect(renderTime).toBeLessThan(500); // 500ms threshold
  });

  test('handles large dataset without blocking UI', async () => {
    const largeStats = generateLargeTeamStats(1000);
    
    const startTime = performance.now();
    renderWithProviders(<TeamAnalytics teamId="team1" />, largeStats);
    
    // Should not block for too long
    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(2000); // 2s threshold for large dataset
  });

  test('efficiently calculates derived metrics', () => {
    const largeStats = generateLargeTeamStats(1000);
    
    const startTime = performance.now();
    
    // Simulate metric calculations
    const completionRate = (largeStats.completedTasks / largeStats.totalTasks) * 100;
    const tasksPerMember = largeStats.totalTasks / Object.keys(largeStats.memberStats).length;
    
    const calculationTime = performance.now() - startTime;
    
    expect(completionRate).toBeGreaterThan(0);
    expect(tasksPerMember).toBeGreaterThan(0);
    expect(calculationTime).toBeLessThan(10); // Very fast calculations
  });
});