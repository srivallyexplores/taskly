import mongoose from 'mongoose';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import secrets from '../../utils/secrets.js';

const { getDocumentDBUri, withRotationRetry } = secrets;

/**
 * Notification Processor — EventBridge Consumer
 *
 * Processes team.member.added and project.updated events to create
 * in-app notifications and queue email notifications for batch delivery.
 *
 * This processor replaces the synchronous notification creation that
 * previously happened inline during API request handling.
 *
 *  7.1, 7.5, 7.6
 */

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const NOTIFICATION_QUEUE_URL = process.env.NOTIFICATION_QUEUE_URL;
const EMAIL_QUEUE_URL = process.env.EMAIL_QUEUE_URL;

let isDbConnected = false;

async function ensureConnection() {
  if (isDbConnected && mongoose.connection.readyState === 1) return;

  const secretName = process.env.DOCUMENTDB_SECRET_NAME || 'taskly/production/documentdb-credentials';

  await withRotationRetry(async () => {
    const uri = await getDocumentDBUri();
    await mongoose.connect(uri, {
      maxPoolSize: 2,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: false,
    });
    isDbConnected = true;
  }, secretName);
}

mongoose.connection.on('disconnected', () => { isDbConnected = false; });

// ─── Handler ─────────────────────────────────────────────────────────────────

/**
 * Lambda handler for notification-related events from EventBridge.
 *
 * Supported event types:
 * - team.member.added: Notify team owner and existing members
 * - project.updated: Notify project watchers
 *
 * @param {object} event - EventBridge event
 * @param {object} context - Lambda context
 */
export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const startTime = Date.now();
  const detailType = event['detail-type'] || event.detailType;
  const detail = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail;
  const { metadata } = detail;

  console.log('[NotificationProcessor] Processing event:', {
    detailType,
    traceId: metadata?.traceId,
    requestId: context.awsRequestId,
  });

  try {
    await ensureConnection();

    let result;
    switch (detailType) {
      case 'team.member.added':
        result = await handleTeamMemberAdded(detail);
        break;
      case 'project.updated':
        result = await handleProjectUpdated(detail);
        break;
      default:
        console.warn('[NotificationProcessor] Unknown event type:', detailType);
        result = { skipped: true, reason: 'unknown event type' };
    }

    const duration = Date.now() - startTime;
    console.log('[NotificationProcessor] Completed:', {
      detailType,
      durationMs: duration,
      result,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ processed: true, ...result }),
    };
  } catch (error) {
    console.error('[NotificationProcessor] Error:', {
      error: error.message,
      detailType,
      requestId: context.awsRequestId,
    });

    throw error; // Let EventBridge retry via DLQ policy
  }
}

// ─── Event Handlers ──────────────────────────────────────────────────────────

async function handleTeamMemberAdded(detail) {
  const { teamId, userId, addedBy, role } = detail;

  const Notification = mongoose.model('Notification');
  const Team = mongoose.model('Team');
  const User = mongoose.model('User');

  // Get team and new member info
  const [team, newMember] = await Promise.all([
    Team.findById(teamId),
    User.findById(userId).select('fullname email'),
  ]);

  if (!team || !newMember) {
    console.warn('[NotificationProcessor] Team or user not found:', { teamId, userId });
    return { skipped: true, reason: 'team or user not found' };
  }

  // Notify team owner
  const notifications = [];
  if (team.owner && team.owner.toString() !== userId) {
    const notification = new Notification({
      user: team.owner,
      type: 'team_member_joined',
      title: `${newMember.fullname} joined ${team.name}`,
      message: `${newMember.fullname} has joined your team "${team.name}" as ${role}`,
      data: { teamId, userId, role },
    });
    await notification.save();
    notifications.push(notification._id);
  }

  // Queue email notification for team owner
  if (EMAIL_QUEUE_URL && team.owner && team.owner.toString() !== userId) {
    const owner = await User.findById(team.owner).select('email fullname');
    if (owner?.email) {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: EMAIL_QUEUE_URL,
          MessageBody: JSON.stringify({
            type: 'team_member_joined',
            to: owner.email,
            data: {
              ownerName: owner.fullname,
              memberName: newMember.fullname,
              teamName: team.name,
              role,
            },
          }),
        })
      );
    }
  }

  return { notificationsCreated: notifications.length };
}

async function handleProjectUpdated(detail) {
  const { projectId, userId, changes } = detail;

  const Notification = mongoose.model('Notification');
  const Project = mongoose.model('Project');
  const User = mongoose.model('User');

  const project = await Project.findById(projectId).populate('members.user', '_id');
  if (!project) {
    console.warn('[NotificationProcessor] Project not found:', projectId);
    return { skipped: true, reason: 'project not found' };
  }

  const updater = await User.findById(userId).select('fullname');
  const updaterName = updater?.fullname || 'Someone';

  // Notify all project members except the updater
  const memberIds = project.members
    .map((m) => (m.user?._id || m.user).toString())
    .filter((id) => id !== userId);

  const notifications = [];
  for (const memberId of memberIds) {
    const notification = new Notification({
      user: memberId,
      type: 'project_updated',
      title: `${project.name} was updated`,
      message: `${updaterName} updated the project "${project.name}"`,
      data: { projectId, changes },
    });
    await notification.save();
    notifications.push(notification._id);
  }

  return { notificationsCreated: notifications.length, membersNotified: memberIds.length };
}

export default { handler };
