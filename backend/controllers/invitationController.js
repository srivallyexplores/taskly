import Invitation from '../models/Invitation.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { publishTeamMemberAdded } from '../services/eventService.js';
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, forbiddenResponse, conflictResponse, createdResponse } from '../utils/response.js';

/**
 * Send invitation to user to join team
 * POST /api/teams/:teamId/invitations
 */
export const sendInvitation = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId, role = 'member', message } = req.body;

    // Validate team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Check if user has permission to send invitations
    const userMember = team.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return forbiddenResponse(res, 'Insufficient permissions to send invitations');
    }

    // Validate invitee exists
    const invitee = await User.findById(userId);
    if (!invitee) {
      return notFoundResponse(res, 'User not found');
    }

    // Check if user is already a team member
    const existingMember = team.members.find(m => m.user.toString() === userId);
    if (existingMember) {
      return conflictResponse(res, 'User is already a team member');
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findExisting(teamId, userId);
    if (existingInvitation) {
      return conflictResponse(res, 'Pending invitation already exists for this user');
    }

    // Check team member limit
    if (team.members.length >= team.settings.maxMembers) {
      return badRequestResponse(res, `Team has reached maximum member limit of ${team.settings.maxMembers}`);
    }

    // Create invitation
    const invitation = new Invitation({
      team: teamId,
      inviter: req.user.id,
      invitee: userId,
      role,
      message: message || null
    });

    await invitation.save();

    // Populate invitation details
    await invitation.populate('team', 'name description avatar');
    await invitation.populate('inviter', 'fullname username avatar');
    await invitation.populate('invitee', 'fullname username email avatar');

    // Create in-app notification
    try {
      await Notification.createNotification(
        userId,
        'invitation_received',
        `Invited to ${team.name}`,
        `${req.user.fullname || 'Someone'} invited you to join ${team.name}`,
        {
          invitationId: invitation._id,
          teamId: team._id,
          inviterId: req.user.id
        }
      );
    } catch (notificationError) {
      //console.error('Error creating notification:', notificationError);
      // Continue even if notification fails
    }

    // TODO: Send notification email
    // const { sendEmail } = await import('../config/resend.js');
    // Send email to invitee

    return createdResponse(res, invitation, 'Invitation sent successfully');
  } catch (error) {
    //console.error('Error sending invitation:', error);
    return errorResponse(res, 'Failed to send invitation', 'SEND_INVITATION_ERROR', 500);
  }
};

/**
 * Get pending invitations for user
 * GET /api/users/invitations
 */
export const getUserInvitations = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

    // Build query
    const query = { invitee: req.user.id };
    if (status && ['pending', 'accepted', 'denied', 'cancelled'].includes(status)) {
      query.status = status;
    }

    // Get invitations
    const invitations = await Invitation.find(query)
      .populate('team', 'name description avatar')
      .populate('inviter', 'fullname username avatar')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    // Get total count
    const total = await Invitation.countDocuments(query);

    return successResponse(res, {
      invitations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Invitations fetched successfully');
  } catch (error) {
    //console.error('Error fetching invitations:', error);
    return errorResponse(res, 'Failed to fetch invitations', 'FETCH_ERROR', 500);
  }
};

/**
 * Get invitations sent by team
 * GET /api/teams/:teamId/invitations
 */
export const getTeamInvitations = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Validate team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Check if user is a team member
    const userMember = team.members.find(m => {
      const memberId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
      return memberId === req.user.id;
    });
    if (!userMember) {
      //console.error(`User ${req.user.id} not found in team ${teamId}. Team members:`, team.members.map(m => typeof m.user === 'object' ? m.user._id.toString() : m.user.toString()));
      return forbiddenResponse(res, 'You are not a member of this team');
    }
    
    // All team members can view pending invitations
    // Only owners and admins can view all invitations
    if (!['owner', 'admin'].includes(userMember.role) && status && status !== 'pending') {
      return forbiddenResponse(res, 'Members can only view pending invitations');
    }

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

    // Build query
    const query = { team: teamId };
    if (status && ['pending', 'accepted', 'denied', 'cancelled'].includes(status)) {
      query.status = status;
    }

    // Get invitations
    const invitations = await Invitation.find(query)
      .populate('invitee', 'fullname username email avatar')
      .populate('inviter', 'fullname username avatar')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    // Get total count
    const total = await Invitation.countDocuments(query);

    return successResponse(res, {
      invitations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Team invitations fetched successfully');
  } catch (error) {
    //console.error('Error fetching team invitations:', error);
    return errorResponse(res, 'Failed to fetch team invitations', 'FETCH_ERROR', 500);
  }
};

/**
 * Accept invitation
 * POST /api/invitations/:invitationId/accept
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return notFoundResponse(res, 'Invitation not found');
    }

    // Check if user is the invitee
    if (invitation.invitee.toString() !== req.user.id) {
      return forbiddenResponse(res, 'You cannot accept this invitation');
    }

    // Check if invitation is pending
    if (invitation.status !== 'pending') {
      return badRequestResponse(res, `Cannot accept ${invitation.status} invitation`);
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      return badRequestResponse(res, 'Invitation has expired');
    }

    // Get team
    const team = await Team.findById(invitation.team);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    // Check if user is already a member
    const existingMember = team.members.find(m => m.user.toString() === req.user.id);
    if (existingMember) {
      return conflictResponse(res, 'You are already a team member');
    }

    // Add user to team
    team.members.push({
      user: req.user.id,
      role: invitation.role,
      joinedAt: new Date()
    });

    // Update invitation status
    invitation.accept();

    // Save changes
    await team.save();
    await invitation.save();

    // Populate response
    await team.populate('owner', 'fullname username avatar');
    await team.populate('members.user', 'fullname username avatar');

    // Publish team.member.added event for async notification processing
    // This replaces synchronous notification creation in the request path
    try {
      await publishTeamMemberAdded(
        team._id.toString(),
        req.user.id,
        invitation.inviter.toString(),
        invitation.role
      );
    } catch (eventError) {
      // Log but don't fail the request — event processing is best-effort
      console.warn('[acceptInvitation] Failed to publish team.member.added event:', eventError.message);
    }

    return successResponse(res, {
      team,
      invitation
    }, 'Invitation accepted successfully');
  } catch (error) {
    //console.error('Error accepting invitation:', error);
    return errorResponse(res, 'Failed to accept invitation', 'ACCEPT_ERROR', 500);
  }
};

/**
 * Deny invitation
 * POST /api/invitations/:invitationId/deny
 */
export const denyInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return notFoundResponse(res, 'Invitation not found');
    }

    // Check if user is the invitee
    if (invitation.invitee.toString() !== req.user.id) {
      return forbiddenResponse(res, 'You cannot deny this invitation');
    }

    // Check if invitation is pending
    if (invitation.status !== 'pending') {
      return badRequestResponse(res, `Cannot deny ${invitation.status} invitation`);
    }

    // Update invitation status
    invitation.deny();
    await invitation.save();

    // Populate response
    await invitation.populate('team', 'name description avatar');
    await invitation.populate('inviter', 'fullname username avatar');

    return successResponse(res, invitation, 'Invitation denied successfully');
  } catch (error) {
    //console.error('Error denying invitation:', error);
    return errorResponse(res, 'Failed to deny invitation', 'DENY_ERROR', 500);
  }
};

/**
 * Cancel invitation (by inviter)
 * DELETE /api/invitations/:invitationId
 */
export const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return notFoundResponse(res, 'Invitation not found');
    }

    // Check if user is the inviter or team owner
    const team = await Team.findById(invitation.team);
    if (!team) {
      return notFoundResponse(res, 'Team not found');
    }

    const userMember = team.members.find(m => m.user.toString() === req.user.id);
    const isInviter = invitation.inviter.toString() === req.user.id;
    const isTeamOwner = userMember && userMember.role === 'owner';

    if (!isInviter && !isTeamOwner) {
      return forbiddenResponse(res, 'You cannot cancel this invitation');
    }

    // Check if invitation is pending
    if (invitation.status !== 'pending') {
      return badRequestResponse(res, `Cannot cancel ${invitation.status} invitation`);
    }

    // Update invitation status
    invitation.cancel();
    await invitation.save();

    // Populate response
    await invitation.populate('team', 'name description avatar');
    await invitation.populate('invitee', 'fullname username avatar');

    // TODO: Send notification to invitee
    // const { sendEmail } = await import('../config/resend.js');
    // Send email to invitee

    return successResponse(res, invitation, 'Invitation cancelled successfully');
  } catch (error) {
    //console.error('Error cancelling invitation:', error);
    return errorResponse(res, 'Failed to cancel invitation', 'CANCEL_ERROR', 500);
  }
};

/**
 * Get invitation by ID
 * GET /api/invitations/:invitationId
 */
export const getInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId)
      .populate('team', 'name description avatar')
      .populate('inviter', 'fullname username avatar')
      .populate('invitee', 'fullname username email avatar');

    if (!invitation) {
      return notFoundResponse(res, 'Invitation not found');
    }

    // Check if user has permission to view this invitation
    const isInvitee = invitation.invitee._id.toString() === req.user.id;
    const isInviter = invitation.inviter._id.toString() === req.user.id;

    if (!isInvitee && !isInviter) {
      return forbiddenResponse(res, 'You cannot view this invitation');
    }

    return successResponse(res, invitation, 'Invitation fetched successfully');
  } catch (error) {
    //console.error('Error fetching invitation:', error);
    return errorResponse(res, 'Failed to fetch invitation', 'FETCH_ERROR', 500);
  }
};
