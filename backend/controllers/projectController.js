import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response.js';

/**
 * Calculate project progress
 * GET /api/projects/:projectId/progress
 */
export const getProjectProgress = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    // Get all tasks for the project
    const allTasks = await Task.find({ project: projectId });
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const totalTasks = allTasks.length;

    // Calculate progress percentage
    const progressPercentage = totalTasks > 0 
      ? Math.round((completedTasks.length / totalTasks) * 100)
      : 0;

    // Calculate member workload
    const memberWorkload = {};
    for (const task of allTasks) {
      if (task.assignee) {
        const assigneeId = task.assignee.toString();
        if (!memberWorkload[assigneeId]) {
          memberWorkload[assigneeId] = {
            total: 0,
            completed: 0
          };
        }
        memberWorkload[assigneeId].total += 1;
        if (task.status === 'completed') {
          memberWorkload[assigneeId].completed += 1;
        }
      }
    }

    // Convert to array with completion rates
    const memberWorkloadArray = Object.entries(memberWorkload).map(([userId, data]) => ({
      userId,
      totalTasks: data.total,
      completedTasks: data.completed,
      completionRate: Math.round((data.completed / data.total) * 100)
    }));

    return successResponse(res, {
      projectId,
      progress: progressPercentage,
      totalTasks,
      completedTasks: completedTasks.length,
      pendingTasks: totalTasks - completedTasks.length,
      memberWorkload: memberWorkloadArray
    }, 'Project progress calculated successfully');
  } catch (error) {
    //console.error('Error calculating project progress:', error);
    return errorResponse(res, 'Failed to calculate project progress', 'CALCULATION_ERROR', 500);
  }
};

/**
 * Get project with full details
 * GET /api/projects/:projectId
 */
export const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('team', 'name')
      .populate('owner', 'fullname username avatar')
      .populate('members.user', 'fullname username avatar')
      .populate('tasks');

    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    // Calculate progress
    const allTasks = await Task.find({ project: projectId });
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const progressPercentage = allTasks.length > 0 
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

    return successResponse(res, {
      ...project.toObject(),
      progress: progressPercentage,
      taskStats: {
        total: allTasks.length,
        completed: completedTasks.length,
        pending: allTasks.length - completedTasks.length
      }
    }, 'Project details fetched successfully');
  } catch (error) {
    //console.error('Error fetching project details:', error);
    return errorResponse(res, 'Failed to fetch project details', 'FETCH_ERROR', 500);
  }
};
