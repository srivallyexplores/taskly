import express from 'express';
import Project from '../models/Project.js';
import Team from '../models/Team.js';
import Task from '../models/Task.js';
import { auth, teamAuth, projectAuth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { successResponse, errorResponse, createdResponse, notFoundResponse, forbiddenResponse, badRequestResponse, conflictResponse } from '../utils/response.js';
import { getProjectProgress, getProjectDetails } from '../controllers/projectController.js';

const router = express.Router();

// Validation middleware for creating projects
const validateProject = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Project name must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('teamId').isMongoId().withMessage('Valid team ID is required'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled']).withMessage('Invalid status')
];

// Validation middleware for updating projects (teamId is optional)
const validateProjectUpdate = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Project name must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('teamId').optional().isMongoId().withMessage('Valid team ID is required'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled']).withMessage('Invalid status')
];

const validateProjectMember = [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['manager', 'contributor', 'viewer']).withMessage('Role must be manager, contributor, or viewer')
];

// GET /api/projects - Get all projects for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { teamId, status, priority } = req.query;
    
    // Build query
    let query = {
      $or: [
        { 'members.user': req.user.id },
        { owner: req.user.id }
      ]
    };

    if (teamId) {
      query.team = teamId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const projects = await Project.find(query)
      .populate('team', 'name')
      .populate('owner', 'fullname username email avatar')
      .populate('members.user', 'fullname username email avatar')
      .sort({ createdAt: -1 });

    return successResponse(res, projects, 'Projects fetched successfully');
  } catch (error) {
    //console.error('Error fetching projects:', error);
    return errorResponse(res, 'Failed to fetch projects', 'FETCH_ERROR', 500);
  }
});

// GET /api/projects/:id/progress - Get project progress
router.get('/:id/progress', auth, getProjectProgress);

// GET /api/projects/:id - Get specific project
router.get('/:id', auth, projectAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team', 'name members')
      .populate('owner', 'fullname username email avatar')
      .populate('members.user', 'fullname username email avatar lastActive')
      .populate('tasks');

    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    return successResponse(res, project, 'Project fetched successfully');
  } catch (error) {
    //console.error('Error fetching project:', error);
    return errorResponse(res, 'Failed to fetch project', 'FETCH_ERROR', 500);
  }
});

// POST /api/projects - Create new project
router.post('/', auth, validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Validation failed', errors.array());
    }

    const { name, description, teamId, startDate, endDate, priority = 'medium', status = 'planning' } = req.body;

    // Verify team exists and user has permission
    const team = await Team.findById(teamId);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    const userMember = team.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return forbiddenResponse(res, 'Insufficient permissions to create project in this team');
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return badRequestResponse(res, 'Start date cannot be after end date');
    }

    const project = new Project({
      name,
      description,
      team: teamId,
      owner: req.user.id,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      priority,
      status,
      members: [{
        user: req.user.id,
        role: 'manager',
        joinedAt: new Date()
      }]
    });

    await project.save();

    // Add project to team
    team.projects = team.projects || [];
    team.projects.push(project._id);
    await team.save();

    await project.populate('team', 'name');
    await project.populate('owner', 'fullname username email avatar');
    await project.populate('members.user', 'fullname username email avatar');

    return createdResponse(res, project, 'Project created successfully');
  } catch (error) {
    //console.error('Error creating project:', error);
    return errorResponse(res, 'Failed to create project', 'CREATE_ERROR', 500);
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', auth, projectAuth, validateProjectUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Validation failed', errors.array());
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    // Check if user has permission to update project
    const userMember = project.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['manager'].includes(userMember.role)) {
      return forbiddenResponse(res, 'Insufficient permissions to update project');
    }

    const { name, description, startDate, endDate, priority, status } = req.body;

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return badRequestResponse(res, 'Start date cannot be after end date');
    }

    project.name = name;
    project.description = description;
    project.startDate = startDate ? new Date(startDate) : project.startDate;
    project.endDate = endDate ? new Date(endDate) : project.endDate;
    project.priority = priority;
    project.status = status;
    project.updatedAt = new Date();

    await project.save();
    await project.populate('team', 'name');
    await project.populate('owner', 'fullname username email avatar');
    await project.populate('members.user', 'fullname username email avatar');

    return successResponse(res, project, 'Project updated successfully');
  } catch (error) {
    //console.error('Error updating project:', error);
    return errorResponse(res, 'Failed to update project', 'UPDATE_ERROR', 500);
  }
});

// POST /api/projects/:id/archive - Archive project
router.post('/:id/archive', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    // Check if user has permission to archive project
    const userMember = project.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['manager'].includes(userMember.role)) {
      if (project.owner.toString() !== req.user.id) {
        return forbiddenResponse(res, 'Insufficient permissions to archive project');
      }
    }

    project.archivedAt = new Date();
    await project.save();

    return successResponse(res, project, 'Project archived successfully');
  } catch (error) {
    //console.error('Error archiving project:', error);
    return errorResponse(res, 'Failed to archive project', 'ARCHIVE_ERROR', 500);
  }
});

// POST /api/projects/:id/unarchive - Unarchive project
router.post('/:id/unarchive', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    // Check if user has permission to unarchive project
    const userMember = project.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['manager'].includes(userMember.role)) {
      if (project.owner.toString() !== req.user.id) {
        return forbiddenResponse(res, 'Insufficient permissions to unarchive project');
      }
    }

    project.archivedAt = null;
    await project.save();

    return successResponse(res, project, 'Project unarchived successfully');
  } catch (error) {
    //console.error('Error updating project:', error);
    return errorResponse(res, 'Failed to update project', 'UPDATE_ERROR', 500);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', auth, projectAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    // Only project owner or team owner can delete project
    const team = await Team.findById(project.team);
    const isTeamOwner = team && team.owner.toString() === req.user.id;
    const isProjectOwner = project.owner.toString() === req.user.id;

    if (!isProjectOwner && !isTeamOwner) {
      return forbiddenResponse(res, 'Insufficient permissions to delete project');
    }

    // Remove project from team
    if (team) {
      team.projects = team.projects.filter(p => p.toString() !== req.params.id);
      await team.save();
    }

    // Delete associated tasks
    await Task.deleteMany({ project: req.params.id });

    await Project.findByIdAndDelete(req.params.id);
    return successResponse(res, null, 'Project deleted successfully');
  } catch (error) {
    //console.error('Error deleting project:', error);
    return errorResponse(res, 'Failed to delete project', 'DELETE_ERROR', 500);
  }
});

// POST /api/projects/:id/members - Add member to project
router.post('/:id/members', auth, projectAuth, validateProjectMember, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Validation failed', errors.array());
    }

    const project = await Project.findById(req.params.id).populate('team');
    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    // Check if user has permission to add members
    const userMember = project.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['manager'].includes(userMember.role)) {
      return forbiddenResponse(res, 'Insufficient permissions to add members');
    }

    const { userId, role = 'contributor' } = req.body;

    // Check if user is a team member
    const isTeamMember = project.team.members.some(m => m.user.toString() === userId);
    if (!isTeamMember) {
      return badRequestResponse(res, 'User must be a team member to join project');
    }

    // Check if user is already a project member
    const existingMember = project.members.find(m => m.user.toString() === userId);
    if (existingMember) {
      return conflictResponse(res, 'User is already a project member');
    }

    project.members.push({
      user: userId,
      role,
      joinedAt: new Date()
    });

    await project.save();
    await project.populate('members.user', 'fullname username email avatar');

    return successResponse(res, project, 'Member added successfully');
  } catch (error) {
    //console.error('Error adding project member:', error);
    return errorResponse(res, 'Failed to add project member', 'ADD_MEMBER_ERROR', 500);
  }
});

// PUT /api/projects/:id/members/:userId - Update member role
router.put('/:id/members/:userId', auth, projectAuth, [
  body('role').isIn(['manager', 'contributor', 'viewer']).withMessage('Role must be manager, contributor, or viewer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Validation failed', errors.array());
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    // Check if user has permission to update member roles (only manager can change roles)
    const userMember = project.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['manager'].includes(userMember.role)) {
      return forbiddenResponse(res, 'Insufficient permissions to update member roles');
    }

    const { role } = req.body;
    const { userId } = req.params;

    // Find member to update
    const memberToUpdate = project.members.find(m => m.user.toString() === userId);
    if (!memberToUpdate) {
      return notFoundResponse(res, 'Member not found in project');
    }

    // Prevent changing project owner role
    if (project.owner.toString() === userId) {
      return badRequestResponse(res, 'Cannot change project owner role');
    }

    // Prevent promoting to manager (only project owner can do this)
    if (role === 'manager' && project.owner.toString() !== req.user.id) {
      return forbiddenResponse(res, 'Only project owner can promote to manager');
    }

    memberToUpdate.role = role;
    project.updatedAt = new Date();

    await project.save();
    await project.populate('members.user', 'fullname username email avatar');

    return successResponse(res, project, 'Member role updated successfully');
  } catch (error) {
    //console.error('Error updating member role:', error);
    return errorResponse(res, 'Failed to update member role', 'UPDATE_ROLE_ERROR', 500);
  }
});

// DELETE /api/projects/:id/members/:userId - Remove member from project
router.delete('/:id/members/:userId', auth, projectAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    const { userId } = req.params;

    // Check if user has permission to remove members or is removing themselves
    const userMember = project.members.find(m => m.user.toString() === req.user.id);
    const isRemovingSelf = userId === req.user.id;
    
    if (!isRemovingSelf && (!userMember || !['manager'].includes(userMember.role))) {
      return forbiddenResponse(res, 'Insufficient permissions to remove members');
    }

    // Find member to remove
    const memberToRemove = project.members.find(m => m.user.toString() === userId);
    if (!memberToRemove) {
      return notFoundResponse(res, 'Member not found in project');
    }

    // Prevent removing project owner
    if (project.owner.toString() === userId) {
      return badRequestResponse(res, 'Cannot remove project owner');
    }

    project.members = project.members.filter(m => m.user.toString() !== userId);
    project.updatedAt = new Date();

    await project.save();
    await project.populate('members.user', 'fullname username email avatar');

    return successResponse(res, project, 'Member removed successfully');
  } catch (error) {
    //console.error('Error removing project member:', error);
    return errorResponse(res, 'Failed to remove project member', 'REMOVE_MEMBER_ERROR', 500);
  }
});

// GET /api/projects/:id/tasks - Get project tasks
router.get('/:id/tasks', auth, projectAuth, async (req, res) => {
  try {
    const { status, priority, assignee } = req.query;
    
    let query = { project: req.params.id };
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (assignee) {
      query.assignee = assignee;
    }

    const tasks = await Task.find(query)
      .populate('assignee', 'fullname username email avatar')
      .populate('user', 'fullname username email avatar')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    //console.error('Error fetching project tasks:', error);
    res.status(500).json({ error: 'Failed to fetch project tasks' });
  }
});

// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', auth, projectAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate progress
    const totalTasks = await Task.countDocuments({ project: project._id });
    const completedTasks = await Task.countDocuments({ project: project._id, status: 'completed' });
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate days remaining
    let daysRemaining = null;
    if (project.endDate) {
      const today = new Date();
      const endDate = new Date(project.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    const stats = {
      memberCount: project.members.length,
      taskCount: totalTasks,
      completedTasks,
      progress,
      daysRemaining,
      tasksByStatus: taskStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      tasksByPriority: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };

    return successResponse(res, stats, 'Project statistics fetched successfully');
  } catch (error) {
    //console.error('Error fetching project stats:', error);
    return errorResponse(res, 'Failed to fetch project statistics', 'FETCH_ERROR', 500);
  }
});

// POST /api/projects/:id/archive - Archive project
router.post('/:id/archive', auth, projectAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has permission to archive project
    const userMember = project.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['manager'].includes(userMember.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to archive project' });
    }

    project.status = 'completed';
    project.archivedAt = new Date();
    project.updatedAt = new Date();

    await project.save();

    res.json(project);
  } catch (error) {
    //console.error('Error archiving project:', error);
    res.status(500).json({ error: 'Failed to archive project' });
  }
});

export default router;