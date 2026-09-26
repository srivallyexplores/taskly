import projectService from '../projectService';
import api from '../api';

// Mock the API module
jest.mock('../api');

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should fetch projects successfully', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', teamId: 'team1' },
        { id: '2', name: 'Project 2', teamId: 'team2' }
      ];

      api.get.mockResolvedValue({ data: mockProjects });

      const result = await projectService.getProjects();

      expect(api.get).toHaveBeenCalledWith('/projects');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProjects);
      expect(result.message).toBe('Projects fetched successfully');
    });

    it('should apply filters correctly', async () => {
      const filters = {
        teamId: 'team1',
        status: 'active',
        priority: 'high'
      };

      api.get.mockResolvedValue({ data: [] });

      await projectService.getProjects(filters);

      expect(api.get).toHaveBeenCalledWith('/projects?teamId=team1&status=active&priority=high');
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };

      api.get.mockRejectedValue(mockError);

      const result = await projectService.getProjects();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal server error');
      expect(result.statusCode).toBe(500);
    });
  });

  describe('getProject', () => {
    it('should fetch a specific project successfully', async () => {
      const mockProject = { id: '1', name: 'Project 1', teamId: 'team1' };
      api.get.mockResolvedValue({ data: mockProject });

      const result = await projectService.getProject('1');

      expect(api.get).toHaveBeenCalledWith('/projects/1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProject);
    });

    it('should return error if project ID is not provided', async () => {
      const result = await projectService.getProject();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID is required');
    });
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        name: 'New Project',
        description: 'A new project',
        teamId: 'team1',
        priority: 'medium',
        status: 'planning'
      };

      const mockCreatedProject = { id: '1', ...projectData };
      api.post.mockResolvedValue({ data: mockCreatedProject });

      const result = await projectService.createProject(projectData);

      expect(api.post).toHaveBeenCalledWith('/projects', {
        name: 'New Project',
        description: 'A new project',
        teamId: 'team1',
        startDate: undefined,
        endDate: undefined,
        priority: 'medium',
        status: 'planning'
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedProject);
    });

    it('should validate project name is required', async () => {
      const result = await projectService.createProject({ name: '', teamId: 'team1' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project name is required');
    });

    it('should validate team ID is required', async () => {
      const result = await projectService.createProject({ name: 'Test Project' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Team ID is required');
    });

    it('should validate date order', async () => {
      const projectData = {
        name: 'Test Project',
        teamId: 'team1',
        startDate: '2024-02-01',
        endDate: '2024-01-01'
      };

      const result = await projectService.createProject(projectData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Start date cannot be after end date');
    });

    it('should handle dates correctly', async () => {
      const projectData = {
        name: 'Test Project',
        teamId: 'team1',
        startDate: '2024-01-01',
        endDate: '2024-02-01'
      };

      const mockCreatedProject = { id: '1', ...projectData };
      api.post.mockResolvedValue({ data: mockCreatedProject });

      await projectService.createProject(projectData);

      expect(api.post).toHaveBeenCalledWith('/projects', expect.objectContaining({
        startDate: new Date('2024-01-01').toISOString(),
        endDate: new Date('2024-02-01').toISOString()
      }));
    });

    it('should use default values', async () => {
      const projectData = {
        name: 'Test Project',
        teamId: 'team1'
      };

      const mockCreatedProject = { id: '1', ...projectData };
      api.post.mockResolvedValue({ data: mockCreatedProject });

      await projectService.createProject(projectData);

      expect(api.post).toHaveBeenCalledWith('/projects', expect.objectContaining({
        priority: 'medium',
        status: 'planning'
      }));
    });
  });

  describe('updateProject', () => {
    it('should update a project successfully', async () => {
      const updateData = { name: 'Updated Project', description: 'Updated description' };
      const mockUpdatedProject = { id: '1', ...updateData };
      
      api.put.mockResolvedValue({ data: mockUpdatedProject });

      const result = await projectService.updateProject('1', updateData);

      expect(api.put).toHaveBeenCalledWith('/projects/1', {
        name: 'Updated Project',
        description: 'Updated description'
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedProject);
    });

    it('should validate project ID is required', async () => {
      const result = await projectService.updateProject('', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID is required');
    });

    it('should validate updated name if provided', async () => {
      const result = await projectService.updateProject('1', { name: '' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project name is required');
    });

    it('should validate description length', async () => {
      const longDescription = 'a'.repeat(1001);
      const result = await projectService.updateProject('1', { description: longDescription });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project description must be less than 1000 characters');
    });

    it('should validate date order in updates', async () => {
      const updateData = {
        startDate: '2024-02-01',
        endDate: '2024-01-01'
      };

      const result = await projectService.updateProject('1', updateData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Start date cannot be after end date');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      api.delete.mockResolvedValue({});

      const result = await projectService.deleteProject('1');

      expect(api.delete).toHaveBeenCalledWith('/projects/1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Project deleted successfully');
    });

    it('should validate project ID is required', async () => {
      const result = await projectService.deleteProject('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID is required');
    });
  });

  describe('addMember', () => {
    it('should add a member successfully', async () => {
      const mockUpdatedProject = { id: '1', members: [{ userId: '2', role: 'contributor' }] };
      api.post.mockResolvedValue({ data: mockUpdatedProject });

      const result = await projectService.addMember('1', '2', 'contributor');

      expect(api.post).toHaveBeenCalledWith('/projects/1/members', {
        userId: '2',
        role: 'contributor'
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedProject);
    });

    it('should validate required parameters', async () => {
      const result = await projectService.addMember('', '2');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID and User ID are required');
    });

    it('should validate role', async () => {
      const result = await projectService.addMember('1', '2', 'invalid');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Role must be manager, contributor, or viewer');
    });

    it('should default to contributor role', async () => {
      const mockUpdatedProject = { id: '1', members: [{ userId: '2', role: 'contributor' }] };
      api.post.mockResolvedValue({ data: mockUpdatedProject });

      await projectService.addMember('1', '2');

      expect(api.post).toHaveBeenCalledWith('/projects/1/members', {
        userId: '2',
        role: 'contributor'
      });
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      const mockUpdatedProject = { id: '1', members: [{ userId: '2', role: 'manager' }] };
      api.put.mockResolvedValue({ data: mockUpdatedProject });

      const result = await projectService.updateMemberRole('1', '2', 'manager');

      expect(api.put).toHaveBeenCalledWith('/projects/1/members/2', { role: 'manager' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedProject);
    });

    it('should validate required parameters', async () => {
      const result = await projectService.updateMemberRole('1', '', 'manager');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID, User ID, and role are required');
    });

    it('should validate role', async () => {
      const result = await projectService.updateMemberRole('1', '2', 'invalid');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Role must be manager, contributor, or viewer');
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      const mockUpdatedProject = { id: '1', members: [] };
      api.delete.mockResolvedValue({ data: mockUpdatedProject });

      const result = await projectService.removeMember('1', '2');

      expect(api.delete).toHaveBeenCalledWith('/projects/1/members/2');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedProject);
    });

    it('should validate required parameters', async () => {
      const result = await projectService.removeMember('', '2');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID and User ID are required');
    });
  });

  describe('getProjectTasks', () => {
    it('should fetch project tasks successfully', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', projectId: '1' },
        { id: '2', title: 'Task 2', projectId: '1' }
      ];
      api.get.mockResolvedValue({ data: mockTasks });

      const result = await projectService.getProjectTasks('1');

      expect(api.get).toHaveBeenCalledWith('/projects/1/tasks');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks);
    });

    it('should apply task filters correctly', async () => {
      const filters = {
        status: 'pending',
        priority: 'high',
        assignee: 'user1'
      };

      api.get.mockResolvedValue({ data: [] });

      await projectService.getProjectTasks('1', filters);

      expect(api.get).toHaveBeenCalledWith('/projects/1/tasks?status=pending&priority=high&assignee=user1');
    });

    it('should validate project ID is required', async () => {
      const result = await projectService.getProjectTasks('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID is required');
    });
  });

  describe('getProjectStats', () => {
    it('should fetch project stats successfully', async () => {
      const mockStats = {
        memberCount: 5,
        taskCount: 10,
        completedTasks: 3,
        progress: 30
      };
      api.get.mockResolvedValue({ data: mockStats });

      const result = await projectService.getProjectStats('1');

      expect(api.get).toHaveBeenCalledWith('/projects/1/stats');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });

    it('should validate project ID is required', async () => {
      const result = await projectService.getProjectStats('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID is required');
    });
  });

  describe('archiveProject', () => {
    it('should archive project successfully', async () => {
      const mockArchivedProject = { id: '1', status: 'completed', archivedAt: new Date() };
      api.post.mockResolvedValue({ data: mockArchivedProject });

      const result = await projectService.archiveProject('1');

      expect(api.post).toHaveBeenCalledWith('/projects/1/archive');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockArchivedProject);
    });

    it('should validate project ID is required', async () => {
      const result = await projectService.archiveProject('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID is required');
    });
  });

  describe('addMilestone', () => {
    it('should add milestone successfully', async () => {
      const milestoneData = {
        name: 'Milestone 1',
        description: 'First milestone',
        dueDate: '2024-02-01'
      };

      const mockUpdatedProject = { id: '1', milestones: [milestoneData] };
      api.post.mockResolvedValue({ data: mockUpdatedProject });

      const result = await projectService.addMilestone('1', milestoneData);

      expect(api.post).toHaveBeenCalledWith('/projects/1/milestones', {
        name: 'Milestone 1',
        description: 'First milestone',
        dueDate: new Date('2024-02-01').toISOString()
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedProject);
    });

    it('should validate project ID is required', async () => {
      const result = await projectService.addMilestone('', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID is required');
    });

    it('should validate milestone name is required', async () => {
      const result = await projectService.addMilestone('1', { name: '' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Milestone name is required');
    });
  });

  describe('updateMilestoneStatus', () => {
    it('should update milestone status successfully', async () => {
      const mockUpdatedProject = { id: '1', milestones: [{ id: 'm1', status: 'completed' }] };
      api.put.mockResolvedValue({ data: mockUpdatedProject });

      const result = await projectService.updateMilestoneStatus('1', 'm1', 'completed');

      expect(api.put).toHaveBeenCalledWith('/projects/1/milestones/m1', { status: 'completed' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedProject);
    });

    it('should validate required parameters', async () => {
      const result = await projectService.updateMilestoneStatus('1', '', 'completed');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID, Milestone ID, and status are required');
    });

    it('should validate status', async () => {
      const result = await projectService.updateMilestoneStatus('1', 'm1', 'invalid');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Status must be pending, in-progress, or completed');
    });
  });

  describe('duplicateProject', () => {
    it('should duplicate project successfully', async () => {
      const options = {
        name: 'Duplicated Project',
        includeTasks: true,
        includeMembers: false
      };

      const mockDuplicatedProject = { id: '2', name: 'Duplicated Project' };
      api.post.mockResolvedValue({ data: mockDuplicatedProject });

      const result = await projectService.duplicateProject('1', options);

      expect(api.post).toHaveBeenCalledWith('/projects/1/duplicate', {
        name: 'Duplicated Project',
        includeTasks: true,
        includeMembers: false
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDuplicatedProject);
    });

    it('should validate project ID is required', async () => {
      const result = await projectService.duplicateProject('', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Project ID is required');
    });

    it('should validate new project name is required', async () => {
      const result = await projectService.duplicateProject('1', { name: '' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('New project name is required');
    });

    it('should use default options', async () => {
      const mockDuplicatedProject = { id: '2', name: 'Test Project' };
      api.post.mockResolvedValue({ data: mockDuplicatedProject });

      await projectService.duplicateProject('1', { name: 'Test Project' });

      expect(api.post).toHaveBeenCalledWith('/projects/1/duplicate', {
        name: 'Test Project',
        includeTasks: false,
        includeMembers: false
      });
    });
  });

  describe('validateProjectData', () => {
    it('should validate valid project data', () => {
      const validData = {
        name: 'Valid Project',
        description: 'Valid description',
        teamId: 'team1',
        priority: 'medium',
        status: 'planning'
      };

      const result = projectService.validateProjectData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: '',
        description: 'a'.repeat(1001),
        priority: 'invalid',
        status: 'invalid'
      };

      const result = projectService.validateProjectData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project name is required');
      expect(result.errors).toContain('Project description must be less than 1000 characters');
      expect(result.errors).toContain('Team ID is required');
      expect(result.errors).toContain('Priority must be low, medium, or high');
      expect(result.errors).toContain('Status must be planning, active, on-hold, completed, or cancelled');
    });

    it('should validate name length', () => {
      const invalidData = {
        name: 'a'.repeat(101),
        teamId: 'team1'
      };

      const result = projectService.validateProjectData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project name must be less than 100 characters');
    });
  });
});