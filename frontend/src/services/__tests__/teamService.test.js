import teamService from '../teamService';
import api from '../api';

// Mock the API module
jest.mock('../api');

describe('TeamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeams', () => {
    it('should fetch teams successfully', async () => {
      const mockTeams = [
        { id: '1', name: 'Team 1', description: 'First team' },
        { id: '2', name: 'Team 2', description: 'Second team' }
      ];

      api.get.mockResolvedValue({ data: mockTeams });

      const result = await teamService.getTeams();

      expect(api.get).toHaveBeenCalledWith('/teams');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTeams);
      expect(result.message).toBe('Teams fetched successfully');
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };

      api.get.mockRejectedValue(mockError);

      const result = await teamService.getTeams();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal server error');
      expect(result.statusCode).toBe(500);
    });

    it('should handle network errors', async () => {
      const mockError = { request: {} };
      api.get.mockRejectedValue(mockError);

      const result = await teamService.getTeams();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error. Please check your connection and try again.');
      expect(result.statusCode).toBe(0);
    });
  });

  describe('getTeam', () => {
    it('should fetch a specific team successfully', async () => {
      const mockTeam = { id: '1', name: 'Team 1', description: 'First team' };
      api.get.mockResolvedValue({ data: mockTeam });

      const result = await teamService.getTeam('1');

      expect(api.get).toHaveBeenCalledWith('/teams/1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTeam);
    });

    it('should return error if team ID is not provided', async () => {
      const result = await teamService.getTeam();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID is required');
    });

    it('should handle 404 errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { error: 'Team not found' }
        }
      };

      api.get.mockRejectedValue(mockError);

      const result = await teamService.getTeam('nonexistent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team not found');
      expect(result.statusCode).toBe(404);
    });
  });

  describe('createTeam', () => {
    it('should create a team successfully', async () => {
      const teamData = {
        name: 'New Team',
        description: 'A new team',
        isPrivate: false
      };

      const mockCreatedTeam = { id: '1', ...teamData };
      api.post.mockResolvedValue({ data: mockCreatedTeam });

      const result = await teamService.createTeam(teamData);

      expect(api.post).toHaveBeenCalledWith('/teams', {
        name: 'New Team',
        description: 'A new team',
        isPrivate: false
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedTeam);
    });

    it('should validate team name is required', async () => {
      const result = await teamService.createTeam({ name: '' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team name is required');
    });

    it('should validate team name length', async () => {
      const longName = 'a'.repeat(101);
      const result = await teamService.createTeam({ name: longName });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team name must be less than 100 characters');
    });

    it('should validate description length', async () => {
      const longDescription = 'a'.repeat(501);
      const result = await teamService.createTeam({
        name: 'Valid Name',
        description: longDescription
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team description must be less than 500 characters');
    });

    it('should handle validation errors from API', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            errors: [
              { msg: 'Team name already exists' },
              { msg: 'Invalid team data' }
            ]
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      const result = await teamService.createTeam({ name: 'Test Team' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team name already exists, Invalid team data');
    });
  });

  describe('updateTeam', () => {
    it('should update a team successfully', async () => {
      const updateData = { name: 'Updated Team', description: 'Updated description' };
      const mockUpdatedTeam = { id: '1', ...updateData };
      
      api.put.mockResolvedValue({ data: mockUpdatedTeam });

      const result = await teamService.updateTeam('1', updateData);

      expect(api.put).toHaveBeenCalledWith('/teams/1', {
        name: 'Updated Team',
        description: 'Updated description'
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedTeam);
    });

    it('should validate team ID is required', async () => {
      const result = await teamService.updateTeam('', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID is required');
    });

    it('should validate updated name if provided', async () => {
      const result = await teamService.updateTeam('1', { name: '' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team name is required');
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team successfully', async () => {
      api.delete.mockResolvedValue({});

      const result = await teamService.deleteTeam('1');

      expect(api.delete).toHaveBeenCalledWith('/teams/1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Team deleted successfully');
    });

    it('should validate team ID is required', async () => {
      const result = await teamService.deleteTeam('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID is required');
    });
  });

  describe('addMember', () => {
    it('should add a member successfully', async () => {
      const mockUpdatedTeam = { id: '1', members: [{ userId: '2', role: 'member' }] };
      api.post.mockResolvedValue({ data: mockUpdatedTeam });

      const result = await teamService.addMember('1', '2', 'member');

      expect(api.post).toHaveBeenCalledWith('/teams/1/members', {
        userId: '2',
        role: 'member'
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedTeam);
    });

    it('should validate required parameters', async () => {
      const result = await teamService.addMember('', '2');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID and User ID are required');
    });

    it('should validate role', async () => {
      const result = await teamService.addMember('1', '2', 'invalid');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Role must be admin or member');
    });

    it('should default to member role', async () => {
      const mockUpdatedTeam = { id: '1', members: [{ userId: '2', role: 'member' }] };
      api.post.mockResolvedValue({ data: mockUpdatedTeam });

      await teamService.addMember('1', '2');

      expect(api.post).toHaveBeenCalledWith('/teams/1/members', {
        userId: '2',
        role: 'member'
      });
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      const mockUpdatedTeam = { id: '1', members: [{ userId: '2', role: 'admin' }] };
      api.put.mockResolvedValue({ data: mockUpdatedTeam });

      const result = await teamService.updateMemberRole('1', '2', 'admin');

      expect(api.put).toHaveBeenCalledWith('/teams/1/members/2', { role: 'admin' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedTeam);
    });

    it('should validate required parameters', async () => {
      const result = await teamService.updateMemberRole('1', '', 'admin');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID, User ID, and role are required');
    });

    it('should validate role', async () => {
      const result = await teamService.updateMemberRole('1', '2', 'invalid');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Role must be owner, admin, or member');
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      const mockUpdatedTeam = { id: '1', members: [] };
      api.delete.mockResolvedValue({ data: mockUpdatedTeam });

      const result = await teamService.removeMember('1', '2');

      expect(api.delete).toHaveBeenCalledWith('/teams/1/members/2');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedTeam);
    });

    it('should validate required parameters', async () => {
      const result = await teamService.removeMember('', '2');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID and User ID are required');
    });
  });

  describe('joinTeam', () => {
    it('should join team successfully', async () => {
      const mockTeam = { id: '1', name: 'Team 1' };
      api.post.mockResolvedValue({ data: mockTeam });

      const result = await teamService.joinTeam('abc123');

      expect(api.post).toHaveBeenCalledWith('/teams/join/abc123');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTeam);
    });

    it('should validate invite code is required', async () => {
      const result = await teamService.joinTeam('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invite code is required');
    });

    it('should trim invite code', async () => {
      const mockTeam = { id: '1', name: 'Team 1' };
      api.post.mockResolvedValue({ data: mockTeam });

      await teamService.joinTeam('  abc123  ');

      expect(api.post).toHaveBeenCalledWith('/teams/join/abc123');
    });
  });

  describe('regenerateInviteCode', () => {
    it('should regenerate invite code successfully', async () => {
      const mockResponse = { inviteCode: 'new123' };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await teamService.regenerateInviteCode('1');

      expect(api.post).toHaveBeenCalledWith('/teams/1/regenerate-invite');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should validate team ID is required', async () => {
      const result = await teamService.regenerateInviteCode('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID is required');
    });
  });

  describe('getTeamStats', () => {
    it('should fetch team stats successfully', async () => {
      const mockStats = {
        memberCount: 5,
        projectCount: 3,
        activeMembers: 4
      };
      api.get.mockResolvedValue({ data: mockStats });

      const result = await teamService.getTeamStats('1');

      expect(api.get).toHaveBeenCalledWith('/teams/1/stats');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });

    it('should validate team ID is required', async () => {
      const result = await teamService.getTeamStats('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID is required');
    });
  });

  describe('sendInvitations', () => {
    it('should send invitations successfully', async () => {
      const emails = ['user1@example.com', 'user2@example.com'];
      const mockResponse = { sent: 2, failed: 0 };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await teamService.sendInvitations('1', emails, 'member', 'Welcome!');

      expect(api.post).toHaveBeenCalledWith('/teams/1/invite', {
        emails: ['user1@example.com', 'user2@example.com'],
        role: 'member',
        message: 'Welcome!'
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should validate required parameters', async () => {
      const result = await teamService.sendInvitations('', []);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID and email addresses are required');
    });

    it('should validate email addresses', async () => {
      const invalidEmails = ['invalid-email', 'another@'];
      const result = await teamService.sendInvitations('1', invalidEmails);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid email addresses');
    });

    it('should validate role', async () => {
      const result = await teamService.sendInvitations('1', ['test@example.com'], 'invalid');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Role must be admin or member');
    });

    it('should default to member role and empty message', async () => {
      const mockResponse = { sent: 1, failed: 0 };
      api.post.mockResolvedValue({ data: mockResponse });

      await teamService.sendInvitations('1', ['test@example.com']);

      expect(api.post).toHaveBeenCalledWith('/teams/1/invite', {
        emails: ['test@example.com'],
        role: 'member',
        message: ''
      });
    });
  });

  describe('searchTeams', () => {
    it('should search teams successfully', async () => {
      const mockResults = [{ id: '1', name: 'Search Result' }];
      api.get.mockResolvedValue({ data: mockResults });

      const result = await teamService.searchTeams({ query: 'test', publicOnly: true });

      expect(api.get).toHaveBeenCalledWith('/teams/search?q=test&public=true');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
    });

    it('should handle empty search parameters', async () => {
      const mockResults = [];
      api.get.mockResolvedValue({ data: mockResults });

      await teamService.searchTeams();

      expect(api.get).toHaveBeenCalledWith('/teams/search?');
    });
  });

  describe('validateTeamData', () => {
    it('should validate valid team data', () => {
      const validData = {
        name: 'Valid Team',
        description: 'Valid description'
      };

      const result = teamService.validateTeamData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: '',
        description: 'a'.repeat(501)
      };

      const result = teamService.validateTeamData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team name is required');
      expect(result.errors).toContain('Team description must be less than 500 characters');
    });

    it('should validate name length', () => {
      const invalidData = {
        name: 'a'.repeat(101)
      };

      const result = teamService.validateTeamData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team name must be less than 100 characters');
    });
  });
});