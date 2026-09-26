import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';

const LevelSystem = ({ 
  user = {
    level: 12,
    experience: 2450,
    totalExperience: 15750,
    nextLevelXP: 3000,
    currentLevelXP: 2000
  },
  className = '' 
}) => {
  const { level, experience, nextLevelXP, currentLevelXP } = user;
  const progressToNext = ((experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  
  const getLevelTier = (level) => {
    if (level >= 50) return { name: 'Legend', color: 'from-purple-500 to-pink-500', icon: SparklesIcon };
    if (level >= 30) return { name: 'Master', color: 'from-orange-500 to-red-500', icon: FireIcon };
    if (level >= 20) return { name: 'Expert', color: 'from-blue-500 to-indigo-500', icon: BoltIcon };
    if (level >= 10) return { name: 'Advanced', color: 'from-green-500 to-teal-500', icon: StarIcon };
    return { name: 'Beginner', color: 'from-gray-500 to-gray-600', icon: TrophyIcon };
  };
  
  const tier = getLevelTier(level);
  const TierIcon = tier.icon;
  
  const levelMilestones = [
    { level: 5, reward: 'Custom Avatar', unlocked: level >= 5 },
    { level: 10, reward: 'Advanced Filters', unlocked: level >= 10 },
    { level: 15, reward: 'Team Features', unlocked: level >= 15 },
    { level: 20, reward: 'Analytics Pro', unlocked: level >= 20 },
    { level: 25, reward: 'Custom Themes', unlocked: level >= 25 },
    { level: 30, reward: 'API Access', unlocked: level >= 30 },
  ];
  
  const nextMilestone = levelMilestones.find(m => !m.unlocked);
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Level Progress
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
            <TierIcon className="w-4 h-4 text-white" />
          </div>
          <span className={`text-sm font-medium bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
            {tier.name}
          </span>
        </div>
      </div>
      
      {/* Level Display */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="relative inline-block"
        >
          {/* Level Circle */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            {/* Background Circle */}
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-secondary-200 dark:text-secondary-700"
              />
              {/* Progress Circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#levelGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - progressToNext / 100) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Level Number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {level}
              </span>
            </div>
          </div>
          
          {/* Level Info */}
          <div className="text-center">
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
              Level {level}
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              {experience.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* XP Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-600 dark:text-secondary-400">Current XP</span>
          <span className="font-medium text-secondary-900 dark:text-secondary-100">
            {experience.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-600 dark:text-secondary-400">Next Level</span>
          <span className="font-medium text-secondary-900 dark:text-secondary-100">
            {(nextLevelXP - experience).toLocaleString()} XP needed
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-600 dark:text-secondary-400">Total XP</span>
          <span className="font-medium text-secondary-900 dark:text-secondary-100">
            {user.totalExperience?.toLocaleString() || '0'}
          </span>
        </div>
      </div>
      
      {/* Next Milestone */}
      {nextMilestone && (
        <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                Next Reward
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-400">
                Level {nextMilestone.level}: {nextMilestone.reward}
              </p>
            </div>
            <TrophyIconSolid className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      )}
      
      {/* Level Milestones */}
      <div>
        <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
          Level Rewards
        </h4>
        <div className="space-y-2">
          {levelMilestones.map((milestone, index) => (
            <motion.div
              key={milestone.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                milestone.unlocked
                  ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
                  : 'bg-secondary-50 dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  milestone.unlocked
                    ? 'bg-success-500 text-white'
                    : 'bg-secondary-300 dark:bg-secondary-600 text-secondary-600 dark:text-secondary-400'
                }`}>
                  {milestone.unlocked ? (
                    <TrophyIconSolid className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{milestone.level}</span>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    milestone.unlocked
                      ? 'text-success-800 dark:text-success-200'
                      : 'text-secondary-700 dark:text-secondary-300'
                  }`}>
                    Level {milestone.level}
                  </p>
                  <p className={`text-xs ${
                    milestone.unlocked
                      ? 'text-success-600 dark:text-success-400'
                      : 'text-secondary-500 dark:text-secondary-400'
                  }`}>
                    {milestone.reward}
                  </p>
                </div>
              </div>
              
              {milestone.unlocked && (
                <span className="text-xs text-success-600 dark:text-success-400 font-medium">
                  Unlocked
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelSystem;