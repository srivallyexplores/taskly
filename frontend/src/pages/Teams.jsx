import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import TeamList from '../components/teams/TeamList';
import CreateTeamModal from '../components/teams/CreateTeamModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { Button } from '../components/ui/Button';

const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, loading, errors, fetchTeams } = useTeam();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleTeamClick = (team) => {
    navigate(`/teams/${team._id}`);
  };

  const handleCreateTeam = () => {
    setShowCreateModal(true);
  };

  if (loading.teams) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Teams
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Collaborate with your team members and manage shared projects.
          </p>
        </div>
        <Button
          onClick={handleCreateTeam}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Create Team
        </Button>
      </div>

      {/* Error Message */}
      {errors.teams && (
        <ErrorMessage 
          message={errors.teams} 
          onRetry={fetchTeams}
        />
      )}

      {/* Teams List */}
      {!loading.teams && !errors.teams && (
        <>
          {teams.length > 0 ? (
            <TeamList 
              onTeamSelect={handleTeamClick}
              onCreateTeam={handleCreateTeam}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-secondary-800 rounded-xl p-12 shadow-lg border border-secondary-200 dark:border-secondary-700 text-center"
            >
              <UsersIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                No Teams Yet
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto mb-6">
                Create your first team to start collaborating with others on shared projects and tasks.
              </p>
              <Button
                onClick={handleCreateTeam}
                className="flex items-center gap-2 mx-auto"
              >
                <PlusIcon className="w-5 h-5" />
                Create Your First Team
              </Button>
            </motion.div>
          )}
        </>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default Teams;