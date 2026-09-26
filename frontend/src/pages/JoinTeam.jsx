import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { Button } from '../components/ui';

const JoinTeam = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { 
    joinTeamByInviteCode, 
    validateInviteCode,
    loading, 
    errors 
  } = useTeam();

  const [teamInfo, setTeamInfo] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (inviteCode) {
      validateInvite();
    }
  }, [inviteCode]);

  const validateInvite = async () => {
    try {
      const info = await validateInviteCode(inviteCode);
      setTeamInfo(info);
    } catch (error) {
      setValidationError(error.message || 'Invalid invite code');
    }
  };

  const handleJoinTeam = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/join/${inviteCode}`);
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinTeamByInviteCode(inviteCode);
      setJoinSuccess(true);
      
      // Redirect to team dashboard after a short delay
      setTimeout(() => {
        navigate(`/teams/${result.teamId}`);
      }, 2000);
    } catch (error) {
      //console.error('Failed to join team:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoToLogin = () => {
    navigate(`/login?redirect=/join/${inviteCode}`);
  };

  const handleGoToSignup = () => {
    navigate(`/signup?redirect=/join/${inviteCode}`);
  };

  if (loading.validateInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">
            Validating invite code...
          </p>
        </div>
      </div>
    );
  }

  if (validationError || errors.validateInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="max-w-md w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              Invalid Invite
            </h1>
            
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              {validationError || errors.validateInvite || 'This invite link is invalid or has expired.'}
            </p>
            
            <Button
              onClick={() => navigate('/teams')}
              className="w-full"
            >
              Go to Teams
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (joinSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="max-w-md w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              Welcome to the team!
            </h1>
            
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              You've successfully joined {teamInfo?.name}. Redirecting to team dashboard...
            </p>
            
            <LoadingSpinner size="sm" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-md w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8"
        >
          {/* Team Info */}
          {teamInfo && (
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                Join {teamInfo.name}
              </h1>
              
              {teamInfo.description && (
                <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                  {teamInfo.description}
                </p>
              )}
              
              <div className="flex items-center justify-center space-x-4 text-sm text-secondary-500 dark:text-secondary-400">
                <span>{teamInfo.memberCount} members</span>
                <span>•</span>
                <span>{teamInfo.projectCount} projects</span>
              </div>
            </div>
          )}

          {/* Join Actions */}
          {isAuthenticated ? (
            <div className="space-y-4">
              <Button
                onClick={handleJoinTeam}
                disabled={isJoining}
                className="w-full"
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              >
                {isJoining ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Joining Team...
                  </>
                ) : (
                  'Join Team'
                )}
              </Button>
              
              <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
                You'll be added as a member and can start collaborating immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-secondary-600 dark:text-secondary-400 mb-6">
                You need to sign in to join this team.
              </p>
              
              <Button
                onClick={handleGoToLogin}
                className="w-full"
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              >
                Sign In to Join
              </Button>
              
              <div className="text-center">
                <span className="text-sm text-secondary-500 dark:text-secondary-400">
                  Don't have an account?{' '}
                </span>
                <button
                  onClick={handleGoToSignup}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Sign up
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default JoinTeam;