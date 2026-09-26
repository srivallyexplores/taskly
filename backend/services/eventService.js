import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { eventBridgeClient } from '../config/aws.js';

/**
 * Event Publishing Service — EventBridge Integration
 *
 * Publishes application events to the custom EventBridge event bus for
 * asynchronous processing by dedicated Lambda consumers.
 *
 * Event types:
 * - task.completed: Triggers achievement processing and stats updates
 * - team.member.added: Triggers team stats updates and notifications
 * - project.updated: Triggers watcher notifications
 * - user.activity: Triggers activity logging and analytics
 *
 *  7.1, 7.2, 7.5, 7.6
 */

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'taskly-prod-events';
const EVENT_SOURCE = 'taskly.api';

/**
 * Publishes an event to the Taskly EventBridge event bus.
 *
 * @param {string} detailType - The event type (e.g., 'task.completed')
 * @param {object} detail - The event payload
 * @param {object} [options] - Additional options
 * @param {string} [options.source] - Override the event source
 * @param {string} [options.traceId] - Correlation/trace ID for observability
 * @returns {Promise<object>} EventBridge PutEvents response
 */
export async function publishEvent(detailType, detail, options = {}) {
  const { source = EVENT_SOURCE, traceId } = options;

  const event = {
    Source: source,
    DetailType: detailType,
    Detail: JSON.stringify({
      ...detail,
      metadata: {
        timestamp: new Date().toISOString(),
        traceId: traceId || undefined,
        environment: process.env.NODE_ENV || 'production',
      },
    }),
    EventBusName: EVENT_BUS_NAME,
  };

  try {
    const command = new PutEventsCommand({
      Entries: [event],
    });

    const response = await eventBridgeClient.send(command);

    if (response.FailedEntryCount > 0) {
      const failedEntry = response.Entries.find((e) => e.ErrorCode);
      console.error('[EventService] Failed to publish event:', {
        detailType,
        errorCode: failedEntry?.ErrorCode,
        errorMessage: failedEntry?.ErrorMessage,
      });
      throw new Error(`EventBridge publish failed: ${failedEntry?.ErrorMessage}`);
    }

    console.log('[EventService] Event published:', {
      detailType,
      eventId: response.Entries[0]?.EventId,
      traceId,
    });

    return response;
  } catch (error) {
    console.error('[EventService] Error publishing event:', {
      detailType,
      error: error.message,
    });
    // Don't throw — event publishing should not break the API request
    // The caller can decide whether to handle the error
    throw error;
  }
}

/**
 * Publishes a batch of events to EventBridge.
 * EventBridge supports up to 10 entries per PutEvents call.
 *
 * @param {Array<{detailType: string, detail: object}>} events - Array of events
 * @param {object} [options] - Additional options
 * @returns {Promise<object>} EventBridge PutEvents response
 */
export async function publishEvents(events, options = {}) {
  const { source = EVENT_SOURCE, traceId } = options;

  // EventBridge limit: 10 entries per PutEvents call
  const batches = [];
  for (let i = 0; i < events.length; i += 10) {
    batches.push(events.slice(i, i + 10));
  }

  const results = [];

  for (const batch of batches) {
    const entries = batch.map((event) => ({
      Source: source,
      DetailType: event.detailType,
      Detail: JSON.stringify({
        ...event.detail,
        metadata: {
          timestamp: new Date().toISOString(),
          traceId: traceId || undefined,
          environment: process.env.NODE_ENV || 'production',
        },
      }),
      EventBusName: EVENT_BUS_NAME,
    }));

    const command = new PutEventsCommand({ Entries: entries });
    const response = await eventBridgeClient.send(command);
    results.push(response);
  }

  return results;
}

// ─── Convenience Methods ─────────────────────────────────────────────────────

/**
 * Publishes a task.completed event.
 * Triggers achievement processing and stats updates.
 */
export async function publishTaskCompleted(taskId, userId, taskData = {}) {
  return publishEvent('task.completed', {
    taskId,
    userId,
    completedAt: new Date().toISOString(),
    ...taskData,
  });
}

/**
 * Publishes a team.member.added event.
 * Triggers team stats updates and notifications.
 */
export async function publishTeamMemberAdded(teamId, userId, addedBy, role = 'member') {
  return publishEvent('team.member.added', {
    teamId,
    userId,
    addedBy,
    role,
    addedAt: new Date().toISOString(),
  });
}

/**
 * Publishes a project.updated event.
 * Triggers watcher notifications.
 */
export async function publishProjectUpdated(projectId, userId, changes = {}) {
  return publishEvent('project.updated', {
    projectId,
    userId,
    changes,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Publishes a user.activity event.
 * Triggers activity logging and analytics.
 */
export async function publishUserActivity(userId, action, resourceType, resourceId) {
  return publishEvent('user.activity', {
    userId,
    action,
    resourceType,
    resourceId,
    occurredAt: new Date().toISOString(),
  });
}

export default {
  publishEvent,
  publishEvents,
  publishTaskCompleted,
  publishTeamMemberAdded,
  publishProjectUpdated,
  publishUserActivity,
};
