import express from 'express';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { auth, teamAuth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { successResponse, errorResponse, createdResponse, notFoundResponse, forbiddenResponse, badRequestResponse, conflictResponse } from '../utils/response.js';
import { searchUsersForTeam } from '../controllers/searchController.js';
import { sendInvitation, getTeamInvitations } from '../controllers/invitationController.js';

const router = express.Router();

// Validation middleware
const validateTeam = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Team name must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean')
];

const validateMemberRole = [
  body('role').isIn(['owner', 'admin', 'member']).withMessage('Role must be owner, admin, or member')
];

// GET /api/teams - Get all teams for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { 'members.user': req.user.id },
        { owner: req.user.id }
      ]
    })
    .populate('owner', 'fullname username email avatar')
    .populate('members.user', 'fullname username email avatar')
    .sort({ createdAt: -1 });

    return successResponse(res, teams, 'Teams fetched successfully');
  } catch (error) {
    //console.error('Error fetching teams:', error);
    return errorResponse(res, 'Failed to fetch teams', 'FETCH_ERROR', 500);
  }
});

// GET /api/teams/:teamId/search-users - Search users for team
router.get('/:teamId/search-users', auth, searchUsersForTeam);

// GET /api/teams/:teamId/members - Get team members with enhanced details
router.get('/:teamId/members', auth, async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
      .populate({
        path: 'members.user',
        select: 'fullname username email avatar bio lastActive'
      });

    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Check if user is team member
    const userMember = team.members.find(m => m.user._id.toString() === req.user.id);
    if (!userMember) {
      return errorResponse(res, 'You are not a member of this team', 'UNAUTHORIZED', 403);
    }

    // Enhance member data with task counts
    const enhancedMembers = await Promise.all(
      team.members.map(async (member) => {
        const taskCount = await Task.countDocuments({
          assignee: member.user._id,
          project: { $in: team.projects || [] }
        });

        const completedTaskCount = await Task.countDocuments({
          assignee: member.user._id,
          project: { $in: team.projects || [] },
          status: 'completed'
        });

        return {
          user: member.user,
          role: member.role,
          joinedAt: member.joinedAt,
          permissions: member.permissions,
          taskCount,
          completedTaskCount,
          completionRate: taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0
        };
      })
    );

    return successResponse(res, {
      members: enhancedMembers,
      memberCount: team.members.length
    }, 'Team members fetched successfully');
  } catch (error) {
    //console.error('Error fetching team members:', error);
    return errorResponse(res, 'Failed to fetch team members', 'FETCH_ERROR', 500);
  }
});

// POST /api/teams/:teamId/invitations - Send invitation
router.post('/:teamId/invitations', auth, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message must be less than 500 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequestResponse(res, 'Validation failed', errors.array());
  }
  const { teamId } = req.params;
  await sendInvitation({ ...req, params: { teamId } }, res);
});

// GET /api/teams/:teamId/invitations - Get team invitations
router.get('/:teamId/invitations', auth, getTeamInvitations);

// GET /api/teams/:id - Get specific team
router.get('/:id', auth, teamAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'fullname username email avatar')
      .populate('members.user', 'fullname username email avatar lastActive')
      .populate('projects');

    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    return successResponse(res, team, 'Team fetched successfully');
  } catch (error) {
    //console.error('Error fetching team:', error.message);
    return errorResponse(res, 'Failed to fetch team', 'FETCH_ERROR', 500);
  }
});

// POST /api/teams - Create new team
router.post('/', auth, validateTeam, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Validation failed', errors.array());
    }

    const { name, description, isPrivate = false } = req.body;

    // Check if team name already exists for this user
    const existingTeam = await Team.findOne({
      name,
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ]
    });

    if (existingTeam) {
      return conflictResponse(res, 'Team name already exists');
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      inviteCode = crypto.randomBytes(8).toString('hex');
      const existingTeam = await Team.findOne({ inviteCode });
      isUnique = !existingTeam;
      attempts++;
    }

    if (!isUnique) {
      return errorResponse(res, 'Failed to generate unique invite code', 'INVITE_CODE_ERROR', 500);
    }

    const team = new Team({
      name,
      description,
      owner: req.user.id,
      isPrivate,
      inviteCode,
      members: [{
        user: req.user.id,
        role: 'owner',
        joinedAt: new Date()
      }]
    });

    await team.save();
    await team.populate('owner', 'fullname username email avatar');
    await team.populate('members.user', 'fullname username email avatar');

    return createdResponse(res, team, 'Team created successfully');
  } catch (error) {
    //console.error('Error creating team:', error);
    return errorResponse(res, 'Failed to create team', 'CREATE_ERROR', 500);
  }
});

// PUT /api/teams/:id - Update team
router.put('/:id', auth, teamAuth, validateTeam, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Validation failed', errors.array());
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Check if user has permission to update team
    const userMember = team.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return forbiddenResponse(res, 'Insufficient permissions to update team');
    }

    const { name, description, isPrivate } = req.body;
    
    team.name = name;
    team.description = description;
    team.isPrivate = isPrivate;
    team.updatedAt = new Date();

    await team.save();
    await team.populate('owner', 'fullname username email avatar');
    await team.populate('members.user', 'fullname username email avatar');

    return successResponse(res, team, 'Team updated successfully');
  } catch (error) {
    //console.error('Error updating team:', error);
    return errorResponse(res, 'Failed to update team', 'UPDATE_ERROR', 500);
  }
});

// PATCH /api/teams/:id/archive - Archive team
router.patch('/:id/archive', auth, teamAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Only owner or admin can archive team
    const userRole = team.getUserRole(req.user.id);
    if (userRole !== 'owner' && userRole !== 'admin') {
      return forbiddenResponse(res, 'Only team owner or admin can archive team');
    }

    team.archived = true;
    team.archivedAt = new Date();
    await team.save();

    return successResponse(res, team, 'Team archived successfully');
  } catch (error) {
    //console.error('Error archiving team:', error);
    return errorResponse(res, 'Failed to archive team', 'ARCHIVE_ERROR', 500);
  }
});

// PATCH /api/teams/:id/unarchive - Unarchive team
router.patch('/:id/unarchive', auth, teamAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Only owner or admin can unarchive team
    const userRole = team.getUserRole(req.user.id);
    if (userRole !== 'owner' && userRole !== 'admin') {
      return forbiddenResponse(res, 'Only team owner or admin can unarchive team');
    }

    team.archived = false;
    team.archivedAt = null;
    await team.save();

    return successResponse(res, team, 'Team unarchived successfully');
  } catch (error) {
    //console.error('Error unarchiving team:', error);
    return errorResponse(res, 'Failed to unarchive team', 'UNARCHIVE_ERROR', 500);
  }
});

// DELETE /api/teams/:id - Delete team
router.delete('/:id', auth, teamAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Only owner can delete team
    if (team.owner.toString() !== req.user.id) {
      return forbiddenResponse(res, 'Only team owner can delete team');
    }

    // Delete all projects in this team
    const Project = (await import('../models/Project.js')).default;
    await Project.deleteMany({ team: req.params.id });

    await Team.findByIdAndDelete(req.params.id);
    return successResponse(res, null, 'Team deleted successfully');
  } catch (error) {
    //console.error('Error deleting team:', error);
    return errorResponse(res, 'Failed to delete team', 'DELETE_ERROR', 500);
  }
});

// POST /api/teams/:id/invite - Send invite to user (alternative to direct add)
router.post('/:id/invite', auth, teamAuth, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Validation failed', errors.array());
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Check if user has permission to invite members
    const userMember = team.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return forbiddenResponse(res, 'Insufficient permissions to invite members');
    }

    const { email, role = 'member' } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return notFoundResponse(res, 'User not found with that email');
    }

    // Check if user is already a member
    const existingMember = team.members.find(m => m.user.toString() === user._id);
    if (existingMember) {
      return conflictResponse(res, 'User is already a team member');
    }

    // Check team member limit
    if (team.members.length >= (process.env.TEAM_MAX_MEMBERS || 50)) {
      return badRequestResponse(res, `Team has reached maximum member limit of ${process.env.TEAM_MAX_MEMBERS || 50}`);
    }

    // Add user to team
    team.members.push({
      user: user._id,
      role,
      joinedAt: new Date()
    });

    await team.save();
    await team.populate('owner', 'fullname username email avatar');
    await team.populate('members.user', 'fullname username email avatar');

    // TODO: Send invitation email via Resend
    // const { sendEmail } = await import('../config/resend.js');
    // const { teamInviteEmail } = await import('../utils/emailTemplates.js');
    // const emailTemplate = teamInviteEmail(req.user.fullname, team.name, inviteLink, email);
    // await sendEmail({ to: email, subject: emailTemplate.subject, html: emailTemplate.html });

    return successResponse(res, team, 'Invitation sent successfully');
  } catch (error) {
    //console.error('Error sending invite:', error);
    return errorResponse(res, 'Failed to send invite', 'INVITE_ERROR', 500);
  }
});

// POST /api/teams/:id/members - Add member to team
router.post('/:id/members', auth, teamAuth, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Validation failed', errors.array());
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Check if user has permission to add members
    const userMember = team.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return forbiddenResponse(res, 'Insufficient permissions to add members');
    }

    const { userId, role = 'member' } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    // Check if user is already a member
    const existingMember = team.members.find(m => m.user.toString() === userId);
    if (existingMember) {
      return conflictResponse(res, 'User is already a team member');
    }

    // Check team member limit
    if (team.members.length >= team.settings.maxMembers) {
      return badRequestResponse(res, `Team has reached maximum member limit of ${team.settings.maxMembers}`);
    }

    team.members.push({
      user: userId,
      role,
      joinedAt: new Date()
    });

    await team.save();
    await team.populate('owner', 'fullname username email avatar');
    await team.populate('members.user', 'fullname username email avatar');

    return successResponse(res, team, 'Member added successfully');
  } catch (error) {
    //console.error('Error adding team member:', error);
    return errorResponse(res, 'Failed to add team member', 'ADD_MEMBER_ERROR', 500);
  }
});

// PUT /api/teams/:id/members/:userId - Update member role
router.put('/:id/members/:userId', auth, teamAuth, validateMemberRole, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Validation failed', errors.array());
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Check if user has permission to update member roles (only owner can change roles)
    const userMember = team.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || userMember.role !== 'owner') {
      return forbiddenResponse(res, 'Only team owner can update member roles');
    }

    const { role } = req.body;
    const { userId } = req.params;

    // Find member to update
    const memberToUpdate = team.members.find(m => m.user.toString() === userId);
    if (!memberToUpdate) {
      return notFoundResponse(res, 'Member not found in team');
    }

    // Prevent changing owner role
    if (memberToUpdate.role === 'owner') {
      return badRequestResponse(res, 'Cannot change owner role');
    }

    // Prevent promoting to owner
    if (role === 'owner') {
      return badRequestResponse(res, 'Cannot promote member to owner role');
    }

    // Prevent self-demotion
    if (userId === req.user.id && role !== memberToUpdate.role) {
      return badRequestResponse(res, 'Cannot change your own role');
    }

    memberToUpdate.role = role;
    team.updatedAt = new Date();

    await team.save();
    await team.populate('owner', 'fullname username email avatar');
    await team.populate('members.user', 'fullname username email avatar');

    return successResponse(res, team, 'Member role updated successfully');
  } catch (error) {
    //console.error('Error updating member role:', error);
    return errorResponse(res, 'Failed to update member role', 'UPDATE_ROLE_ERROR', 500);
  }
});

// DELETE /api/teams/:id/members/:userId - Remove member from team
router.delete('/:id/members/:userId', auth, teamAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    const { userId } = req.params;

    // Check if user has permission to remove members or is removing themselves
    const userMember = team.members.find(m => m.user.toString() === req.user.id);
    const isRemovingSelf = userId === req.user.id;
    
    if (!isRemovingSelf && (!userMember || !['owner', 'admin'].includes(userMember.role))) {
      return forbiddenResponse(res, 'Insufficient permissions to remove members');
    }

    // Find member to remove
    const memberToRemove = team.members.find(m => m.user.toString() === userId);
    if (!memberToRemove) {
      return notFoundResponse(res, 'Member not found in team');
    }

    // Prevent removing owner
    if (memberToRemove.role === 'owner') {
      return badRequestResponse(res, 'Cannot remove team owner');
    }

    // Prevent removing last owner (safety check)
    const ownerCount = team.members.filter(m => m.role === 'owner').length;
    if (ownerCount === 0) {
      return badRequestResponse(res, 'Team must have at least one owner');
    }

    // Remove member from all projects in this team
    const Project = (await import('../models/Project.js')).default;
    const teamProjects = await Project.find({ team: req.params.id });
    for (const project of teamProjects) {
      project.members = project.members.filter(m => m.user.toString() !== userId);
      await project.save();
    }

    // Remove member from team
    team.members = team.members.filter(m => m.user.toString() !== userId);
    team.updatedAt = new Date();

    await team.save();
    await team.populate('owner', 'fullname username email avatar');
    await team.populate('members.user', 'fullname username email avatar');

    return successResponse(res, team, 'Member removed successfully');
  } catch (error) {
    //console.error('Error removing team member:', error);
    return errorResponse(res, 'Failed to remove team member', 'REMOVE_MEMBER_ERROR', 500);
  }
});

// GET /api/teams/invite/:inviteCode/info - Get team info by invite code (without joining)
router.get('/invite/:inviteCode/info', auth, async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const team = await Team.findOne({ inviteCode })
      .populate('owner', 'fullname username avatar');
    
    if (!team) {
      return notFoundResponse(res, 'Invalid invite code');
    }

    // Return basic team info without sensitive data
    const teamInfo = {
      _id: team._id,
      name: team.name,
      description: team.description,
      memberCount: team.members.length,
      projectCount: team.projects ? team.projects.length : 0,
      owner: team.owner,
      isPrivate: team.isPrivate,
      createdAt: team.createdAt
    };

    return successResponse(res, teamInfo, 'Team info fetched successfully');
  } catch (error) {
    //console.error('Error fetching team info:', error);
    return errorResponse(res, 'Failed to fetch team info', 'FETCH_ERROR', 500);
  }
});

// POST /api/teams/join/:inviteCode - Join team with invite code
router.post('/join/:inviteCode', auth, async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const team = await Team.findOne({ inviteCode });
    if (!team) {
      return notFoundResponse(res, 'Invalid invite code');
    }

    // Check if user is already a member
    const existingMember = team.members.find(m => m.user.toString() === req.user.id);
    if (existingMember) {
      return conflictResponse(res, 'You are already a member of this team');
    }

    team.members.push({
      user: req.user.id,
      role: 'member',
      joinedAt: new Date()
    });

    await team.save();
    await team.populate('owner', 'fullname username email avatar');
    await team.populate('members.user', 'fullname username email avatar');

    return successResponse(res, team, 'Successfully joined team');
  } catch (error) {
    //console.error('Error joining team:', error);
    return errorResponse(res, 'Failed to join team', 'JOIN_TEAM_ERROR', 500);
  }
});

// POST /api/teams/:id/regenerate-invite - Regenerate invite code
router.post('/:id/regenerate-invite', auth, teamAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Check if user has permission to regenerate invite code
    const userMember = team.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return forbiddenResponse(res, 'Insufficient permissions to regenerate invite code');
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      inviteCode = crypto.randomBytes(8).toString('hex');
      const existingTeam = await Team.findOne({ inviteCode });
      isUnique = !existingTeam;
      attempts++;
    }

    if (!isUnique) {
      return errorResponse(res, 'Failed to generate unique invite code', 'INVITE_CODE_ERROR', 500);
    }

    team.inviteCode = inviteCode;
    team.updatedAt = new Date();

    await team.save();

    return successResponse(res, { inviteCode: team.inviteCode }, 'Invite code regenerated successfully');
  } catch (error) {
    //console.error('Error regenerating invite code:', error);
    return errorResponse(res, 'Failed to regenerate invite code', 'REGENERATE_ERROR', 500);
  }
});

// GET /api/teams/:id/stats - Get team statistics
router.get('/:id/stats', auth, teamAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('projects')
      .populate('members.user', 'fullname username email avatar lastActive');

    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Get all tasks for team projects
    const projectIds = team.projects ? team.projects.map(p => p._id) : [];
    
    const allTasks = await Task.find({ project: { $in: projectIds } });
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const overdueTasks = allTasks.filter(t => {
      return t.status !== 'completed' && new Date(t.due) < new Date();
    }).length;

    // Calculate team statistics
    const stats = {
      memberCount: team.members.length,
      projectCount: team.projects ? team.projects.length : 0,
      activeProjects: team.projects ? team.projects.filter(p => p.status === 'active').length : 0,
      completedProjects: team.projects ? team.projects.filter(p => p.status === 'completed').length : 0,
      taskCount: allTasks.length,
      completedTasks: completedTasks,
      overdueTasks: overdueTasks,
      activeMembers: team.members.filter(m => {
        const lastActive = m.user?.lastActive;
        if (!lastActive) return false;
        const daysSinceActive = (Date.now() - new Date(lastActive)) / (1000 * 60 * 60 * 24);
        return daysSinceActive <= 7; // Active in last 7 days
      }).length,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    };

    return successResponse(res, stats, 'Team statistics fetched successfully');
  } catch (error) {
    //console.error('Error fetching team stats:', error);
    return errorResponse(res, 'Failed to fetch team statistics', 'FETCH_ERROR', 500);
  }
});

export default router;