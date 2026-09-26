import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamList from '../TeamList';
import { TeamProvider } from '../../../context/TeamContext';

const mockTeams = [
  {
    _id: 'team1',
    name: 'Development Team',
    description: 'Main development team',
    members: [{ user: { name: 'John' } }, { user: { name: 'Jane' } }],
    projects: ['proj1', 'proj2']
  },
  {
    _id: 'team2',
    name: 'Design Team',
    description: 'UI/UX design team',
    members: [{ user: { name: 'Alice' } }],
    projects: ['proj3']
  }
];

const mockTeamContext = {
  teams: mockTeams,
  filteredTeams: mockTeams,
  loading: { teams: false },
  errors: {},
  filters: { search: '', status: 'all' },
  setFilters: jest.fn(),
  fetchTeams: jest.fn(),
  createTeam: jest.fn()
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <TeamProvider value={mockTeamContext}>
        {component}
      </TeamProvider>
    </BrowserRouter>
  );
};

describe('TeamList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders list of teams', () => {
    renderWithProviders(<TeamList />);
    
    expect(screen.getByText('Development Team')).toBeInTheDocument();
    expect(screen.getByText('Design Team')).toBeInTheDocument();
  });

  test('filters teams based on search input', async () => {
    renderWithProviders(<TeamList />);
    
    const searchInput = screen.getByPlaceholderText(/search teams/i);
    fireEvent.change(searchInput, { target: { value: 'Development' } });
    
    await waitFor(() => {
      expect(mockTeamContext.setFilters).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Development' })
      );
    });
  });

  test('shows create team button when showCreateButton is true', () => {
    renderWithProviders(<TeamList showCreateButton={true} />);
    
    expect(screen.getByText(/create team/i)).toBeInTheDocument();
  });

  test('calls onTeamSelect when team is clicked', () => {
    const onTeamSelect = jest.fn();
    renderWithProviders(<TeamList onTeamSelect={onTeamSelect} />);
    
    fireEvent.click(screen.getByText('Development Team'));
    expect(onTeamSelect).toHaveBeenCalledWith(mockTeams[0]);
  });

  test('shows empty state when no teams', () => {
    const emptyContext = {
      ...mockTeamContext,
      teams: [],
      filteredTeams: []
    };
    
    render(
      <BrowserRouter>
        <TeamProvider value={emptyContext}>
          <TeamList />
        </TeamProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/no teams found/i)).toBeInTheDocument();
  });
});