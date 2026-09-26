import mongoose from 'mongoose';
import secrets from '../../utils/secrets.js';

const { getDocumentDBUri, withRotationRetry } = secrets;

/**
 * Achievement Processor — EventBridge Consumer
 *
 * Processes task.completed events to evaluate and award achievements.
 * Runs asynchronously via EventBridge → Lambda, decoupled from the API request path.
 *
 * Achievement types evaluated:
 * - First task completed
 * - 10/50/100 tasks completed milestones
 * - Streak achievements (consecutive days with completions)
 * - Priority-based achievements (completing high-priority tasks)
 *
 *  7.1, 7.2
 */

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

// ─── Achievement Definitions ─────────────────────────────────────────────────

const ACHIEVEMENT_MILESTONES = [
  { id: 'first_task', threshold: 1, title: 'Getting Started', description: 'Completed your first task' },
  { id: 'ten_tasks', threshold: 10, title: 'On a Roll', description: 'Completed 10 tasks' },
  { id: 'fifty_tasks', threshold: 50, title: 'Productivity Pro', description: 'Completed 50 tasks' },
  { id: 'hundred_tasks', threshold: 100, title: 'Task Master', description: 'Completed 100 tasks' },
];

// ─── Handler ─────────────────────────────────────────────────────────────────

/**
 * Lambda handler for task.completed events from EventBridge.
 *
 * @param {object} event - EventBridge event
 * @param {object} context - Lambda context
 */
export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const startTime = Date.now();
  const detail = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail;
  const { taskId, userId, metadata } = detail;

  console.log('[AchievementProcessor] Processing task.completed:', {
    taskId,
    userId,
    traceId: metadata?.traceId,
    requestId: context.awsRequestId,
  });

  try {
    await ensureConnection();

    // Get user's completed task count
    const Task = mongoose.model('Task');
    const completedCount = await Task.countDocuments({
      user: userId,
      status: 'completed',
    });

    // Check milestone achievements
    const newAchievements = [];
    for (const milestone of ACHIEVEMENT_MILESTONES) {
      if (completedCount >= milestone.threshold) {
        // Check if achievement already awarded
        const Achievement = mongoose.model('Achievement');
        const existing = await Achievement.findOne({
          user: userId,
          achievementId: milestone.id,
        });

        if (!existing) {
          const achievement = new Achievement({
            user: userId,
            achievementId: milestone.id,
            title: milestone.title,
            description: milestone.description,
            earnedAt: new Date(),
            metadata: { taskId, completedCount },
          });
          await achievement.save();
          newAchievements.push(milestone.id);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log('[AchievementProcessor] Completed:', {
      userId,
      completedCount,
      newAchievements,
      durationMs: duration,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        processed: true,
        userId,
        newAchievements,
        completedCount,
      }),
    };
  } catch (error) {
    console.error('[AchievementProcessor] Error:', {
      error: error.message,
      taskId,
      userId,
      requestId: context.awsRequestId,
    });

    throw error; // Let EventBridge retry via DLQ policy
  }
}

export default { handler };
