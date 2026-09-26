import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  FolderIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useProject } from '../../context/ProjectContext';
import StatCard from '../common/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ProjectDashboard = ({ projectId }) => {
  const navigate = useNavigate();
  const {
    currentProject,
    projectStats,
    projectTasks,
    fetchProject,
    fetchProjectStats,
    fetchProjectTasks,
    loading,
    errors
  } = useProject();

  useEffect(() => {
    if (projectId && (!currentProject || currentProject._id !== projectId)) {
      fetchProject(projectId);
      fetchProjectStats(projectId);
      fetchProjectTasks(projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleTeamClick = () => {
    if (currentProject?.team?._id) {
      navigate(`/teams/${currentProject.team._id}`);
    }
  };

  if (loading.currentProject || loading.stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (errors.currentProject || errors.stats) {
    return (
      <ErrorMessage 
        message={errors.currentProject || errors.stats} 
        onRetry={() => {
          fetchProject(projectId);
          fetchProjectStats(projectId);
        }}
      />
    );
  }

  if (!currentProject) {
    return <ErrorMessage message="Project not found" />;
  }

  const stats = projectStats || {};
  const completedTasks = stats.completedTasks || 0;
  const totalTasks = stats.taskCount || 0;
  const inProgressTasks = totalTasks - completedTasks;
  const progress = stats.progress || 0;
  const memberCount = currentProject.members?.length || 0;

  return (
    <div className="space-y-6">
      {/* Parent Team Information */}
      {currentProject.team && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Part of Team</p>
                <button
                  onClick={handleTeamClick}
                  className="text-lg font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                >
                  {currentProject.team.name || 'Team'}
                </button>
              </div>
            </div>
            <button
              onClick={handleTeamClick}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View Team →
            </button>
          </div>
        </motion.div>
      )}

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          icon={CheckCircleIcon}
          color="green"
          subtitle={`${totalTasks} total`}
        />

        <StatCard
          title="In Progress"
          value={inProgressTasks}
          icon={ClockIcon}
          color="blue"
        />

        <StatCard
          title="Team Members"
          value={memberCount}
          icon={UsersIcon}
          color="purple"
        />

        <StatCard
          title="Progress"
          value={`${Math.round(progress)}%`}
          icon={ChartBarIcon}
          color="orange"
        />
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Project Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
              <p className="text-gray-900 dark:text-white mt-1">
                {currentProject.description || 'No description provided'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  currentProject.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  currentProject.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  currentProject.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {currentProject.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  currentProject.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  currentProject.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {currentProject.priority}
                </span>
              </div>
            </div>
            {(currentProject.startDate || currentProject.endDate) && (
              <div className="grid grid-cols-2 gap-4">
                {currentProject.startDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {new Date(currentProject.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {currentProject.endDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {new Date(currentProject.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}
            {stats.daysRemaining !== null && stats.daysRemaining !== undefined && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Days Remaining</p>
                <p className={`text-lg font-semibold mt-1 ${
                  stats.daysRemaining < 0 ? 'text-red-600 dark:text-red-400' :
                  stats.daysRemaining < 7 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {stats.daysRemaining < 0 ? `${Math.abs(stats.daysRemaining)} days overdue` : `${stats.daysRemaining} days`}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            {stats.tasksByStatus && Object.keys(stats.tasksByStatus).length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tasks by Status</p>
                <div className="space-y-2">
                  {Object.entries(stats.tasksByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.tasksByPriority && Object.keys(stats.tasksByPriority).length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tasks by Priority</p>
                <div className="space-y-2">
                  {Object.entries(stats.tasksByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{priority}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow"
      >
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Tasks
          </h3>
          {loading.tasks ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : projectTasks && projectTasks.length > 0 ? (
            <div className="space-y-3">
              {projectTasks.slice(0, 5).map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className={`w-5 h-5 ${
                      task.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm text-gray-900 dark:text-white">{task.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No tasks yet
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectDashboard;