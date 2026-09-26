import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import Avatar from '../common/Avatar';

const ProjectProgress = ({ projectId, onArchive }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgress();
  }, [projectId]);

  const fetchProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/projects/${projectId}/progress`);
      if (response.data.success) {
        setProgress(response.data.data);
      }
    } catch (err) {
      //console.error('Error fetching progress:', err);
      setError('Failed to load project progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {progress && (
        <>
          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Project Progress
              </h3>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {progress.progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  {progress.completedTasks}
                </p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Completed
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  {progress.pendingTasks}
                </p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Pending
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  {progress.totalTasks}
                </p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Total
                </p>
              </div>
            </div>
          </motion.div>

          {/* Member Workload */}
          {progress.memberWorkload && progress.memberWorkload.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6"
            >
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                Member Workload
              </h3>

              <div className="space-y-3">
                {progress.memberWorkload.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {member.completedTasks}/{member.totalTasks} tasks
                        </span>
                        <span className="text-sm text-secondary-600 dark:text-secondary-400">
                          {member.completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${member.completionRate}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full bg-green-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          {onArchive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-end"
            >
              <button
                onClick={onArchive}
                className="flex items-center space-x-2 px-4 py-2 bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-lg transition-colors"
              >
                <ArchiveBoxIcon className="w-4 h-4" />
                <span>Archive Project</span>
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectProgress;
