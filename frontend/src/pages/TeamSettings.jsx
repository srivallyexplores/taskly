import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import TeamSettings from '../components/teams/TeamSettings';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { Button } from '../components/ui';

const TeamSettingsPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentTeam, 
    loading, 
    errors, 
    fetchTeam,
    canPerformAction 
  } = useTeam();

  useEffect(() => {
    if (teamId) {
      fetchTeam(teamId);
    }
  }, [teamId, fetchTeam]);

  const handleBack = () => {
    navigate(`/teams/${teamId}`);
  };

  if (loading.currentTeam) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (errors.currentTeam) {
    return (
      <ErrorMessage 
        message={errors.currentTeam} 
        onRetry={() => fetchTeam(teamId)}
      />
    );
  }

  if (!currentTeam) {
    return (
      <ErrorMessage 
        message="Team not found" 
        action={{
          label: 'Back to Teams',
          onClick: () => navigate('/teams')
        }}
      />
    );
  }

  if (!canPerformAction(teamId, 'manage_team_settings')) {
    return (
      <ErrorMessage 
        message="You don't have permission to access team settings" 
        action={{
          label: 'Back to Team',
          onClick: handleBack
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Back to Team
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                Team Settings
              </h1>
              <p className="text-secondary-600 dark:text-secondary-400">
                Manage {currentTeam.name} settings and members
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Team Settings Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TeamSettings 
          teamId={teamId} 
          isOpen={true} 
          onClose={() => navigate(`/teams/${teamId}`)} 
        />
      </motion.div>
    </div>
  );
};

export default TeamSettingsPage;