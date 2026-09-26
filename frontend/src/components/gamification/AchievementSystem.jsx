import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  StarIcon,
  FireIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  CalendarIcon,
  BoltIcon,
  SparklesIcon,
  LockClosedIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import { Button } from '../ui';

const AchievementSystem = ({ userStats, onAchievementUnlocked, className = '' }) => {
  const [achievements, setAchievements] = useState([]);
  const [showUnlockedAnimation, setShowUnlockedAnimation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Achievement categories
  const categories = [
    { id: 'all', name: 'All', icon: TrophyIcon },
    { id: 'productivity', name: 'Productivity', icon: CheckCircleIcon },
    { id: 'consistency', name: 'Consistency', icon: CalendarIcon },
    { id: 'collaboration', name: 'Collaboration', icon: UserGroupIcon },
    { id: 'speed', name: 'Speed', icon: BoltIcon },
    { id: 'special', name: 'Special', icon: SparklesIcon }
  ];
  
  // Achievement definitions
  const achievementDefinitions = [
    {
      id: 'first-task',
      name: 'Getting Started',
      description: 'Complete your first task',
      category: 'productivity',
      icon: CheckCircleIcon,
      rarity: 'common',
      points: 10,
      condition: (stats) => stats.tasksCompleted >= 1,
      progress: (stats) => Math.min(stats.tasksCompleted, 1),
      maxProgress: 1
    },
    {
      id: 'task-master',
      name: 'Task Master',
      description: 'Complete 100 tasks',
      category: 'productivity',
      icon: TrophyIcon,
      rarity: 'rare',
      points: 100,
      condition: (stats) => stats.tasksCompleted >= 100,
      progress: (stats) => Math.min(stats.tasksCompleted, 100),
      maxProgress: 100
    },
    {
      id: 'speed-demon',
      name: 'Speed Demon',
      description: 'Complete 10 tasks in one day',
      category: 'speed',
      icon: BoltIcon,
      rarity: 'epic',
      points: 50,
      condition: (stats) => stats.tasksCompletedToday >= 10,
      progress: (stats) => Math.min(stats.tasksCompletedToday, 10),
      maxProgress: 10
    },
    {
      id: 'streak-warrior',
      name: 'Streak Warrior',
      description: 'Maintain a 7-day completion streak',
      category: 'consistency',
      icon: FireIcon,
      rarity: 'rare',
      points: 75,
      condition: (stats) => stats.currentStreak >= 7,
      progress: (stats) => Math.min(stats.currentStreak, 7),
      maxProgress: 7
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Complete 20 tasks before their due date',
      category: 'speed',
      icon: ClockIcon,
      rarity: 'uncommon',
      points: 30,
      condition: (stats) => stats.earlyCompletions >= 20,
      progress: (stats) => Math.min(stats.earlyCompletions, 20),
      maxProgress: 20
    },
    {
      id: 'team-player',
      name: 'Team Player',
      description: 'Help 5 teammates with their tasks',
      category: 'collaboration',
      icon: UserGroupIcon,
      rarity: 'uncommon',
      points: 40,
      condition: (stats) => stats.teamHelps >= 5,
      progress: (stats) => Math.min(stats.teamHelps, 5),
      maxProgress: 5
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Complete 50 high-priority tasks',
      category: 'productivity',
      icon: StarIcon,
      rarity: 'epic',
      points: 80,
      condition: (stats) => stats.highPriorityCompleted >= 50,
      progress: (stats) => Math.min(stats.highPriorityCompleted, 50),
      maxProgress: 50
    },
    {
      id: 'consistency-king',
      name: 'Consistency King',
      description: 'Complete at least one task every day for 30 days',
      category: 'consistency',
      icon: CalendarIcon,
      rarity: 'legendary',
      points: 150,
      condition: (stats) => stats.longestStreak >= 30,
      progress: (stats) => Math.min(stats.longestStreak, 30),
      maxProgress: 30
    },
    {
      id: 'night-owl',
      name: 'Night Owl',
      description: 'Complete 10 tasks after 10 PM',
      category: 'special',
      icon: SparklesIcon,
      rarity: 'rare',
      points: 60,
      condition: (stats) => stats.lateNightCompletions >= 10,
      progress: (stats) => Math.min(stats.lateNightCompletions, 10),
      maxProgress: 10
    }
  ];
  
  // Sample user stats
  const defaultStats = {
    tasksCompleted: 45,
    tasksCompletedToday: 3,
    currentStreak: 5,
    longestStreak: 12,
    earlyCompletions: 15,
    teamHelps: 2,
    highPriorityCompleted: 20,
    lateNightCompletions: 8,
    ...userStats
  };
  
  useEffect(() => {
    // Check achievements and update status
    const updatedAchievements = achievementDefinitions.map(achievement => {
      const isUnlocked = achievement.condition(defaultStats);
      const progress = achievement.progress(defaultStats);
      const progressPercentage = (progress / achievement.maxProgress) * 100;
      
      return {
        ...achievement,
        unlocked: isUnlocked,
        progress,
        progressPercentage,
        unlockedAt: isUnlocked ? new Date() : null
      };
    });
    
    setAchievements(updatedAchievements);
    
    // Check for newly unlocked achievements
    const newlyUnlocked = updatedAchievements.find(a => 
      a.unlocked && !achievements.find(old => old.id === a.id && old.unlocked)
    );
    
    if (newlyUnlocked) {
      setShowUnlockedAnimation(newlyUnlocked);
      onAchievementUnlocked?.(newlyUnlocked);
      
      setTimeout(() => {
        setShowUnlockedAnimation(null);
      }, 3000);
    }
  }, [userStats]);
  
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-600';
      case 'uncommon':
        return 'from-green-400 to-green-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };
  
  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 dark:border-gray-600';
      case 'uncommon':
        return 'border-green-300 dark:border-green-600';
      case 'rare':
        return 'border-blue-300 dark:border-blue-600';
      case 'epic':
        return 'border-purple-300 dark:border-purple-600';
      case 'legendary':
        return 'border-yellow-300 dark:border-yellow-600';
      default:
        return 'border-gray-300 dark:border-gray-600';
    }
  };
  
  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Achievement Unlock Animation */}
      <AnimatePresence>
        {showUnlockedAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-8 rounded-2xl shadow-2xl text-center max-w-sm">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <TrophyIconSolid className="w-16 h-16 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">Achievement Unlocked!</h3>
              <p className="text-lg font-semibold">{showUnlockedAnimation.name}</p>
              <p className="text-sm opacity-90 mt-1">{showUnlockedAnimation.description}</p>
              <div className="mt-4 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  +{showUnlockedAnimation.points} points
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Achievements
          </h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            {unlockedCount} of {achievements.length} unlocked • {totalPoints} points earned
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
            <TrophyIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
      
      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map((achievement, index) => {
          const Icon = achievement.icon;
          const isLocked = !achievement.unlocked;
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                isLocked 
                  ? 'border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-700/50 opacity-75'
                  : `${getRarityBorder(achievement.rarity)} bg-white dark:bg-secondary-800 shadow-sm hover:shadow-md`
              }`}
            >
              {/* Rarity Indicator */}
              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}`} />
              
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isLocked 
                    ? 'bg-secondary-200 dark:bg-secondary-600'
                    : `bg-gradient-to-r ${getRarityColor(achievement.rarity)}`
                }`}>
                  {isLocked ? (
                    <LockClosedIcon className="w-6 h-6 text-secondary-500 dark:text-secondary-400" />
                  ) : (
                    <Icon className="w-6 h-6 text-white" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-semibold ${
                      isLocked 
                        ? 'text-secondary-500 dark:text-secondary-400'
                        : 'text-secondary-900 dark:text-secondary-100'
                    }`}>
                      {achievement.name}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      isLocked
                        ? 'bg-secondary-200 dark:bg-secondary-600 text-secondary-600 dark:text-secondary-400'
                        : `bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`
                    }`}>
                      {achievement.rarity}
                    </span>
                  </div>
                  
                  <p className={`text-xs mb-3 ${
                    isLocked 
                      ? 'text-secondary-400 dark:text-secondary-500'
                      : 'text-secondary-600 dark:text-secondary-400'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {/* Progress Bar */}
                  {!achievement.unlocked && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-secondary-500 dark:text-secondary-400">
                          Progress
                        </span>
                        <span className="text-secondary-600 dark:text-secondary-400">
                          {achievement.progress} / {achievement.maxProgress}
                        </span>
                      </div>
                      <div className="w-full bg-secondary-200 dark:bg-secondary-600 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progressPercentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`h-2 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium ${
                        isLocked 
                          ? 'text-secondary-400 dark:text-secondary-500'
                          : 'text-primary-600 dark:text-primary-400'
                      }`}>
                        {achievement.points} points
                      </span>
                      {achievement.unlocked && achievement.unlockedAt && (
                        <span className="text-xs text-secondary-500 dark:text-secondary-400">
                          • Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {achievement.unlocked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => {
                          // Share achievement functionality
                          //console.log('Share achievement:', achievement.name);
                        }}
                      >
                        <ShareIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-8">
          <TrophyIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
          <p className="text-secondary-500 dark:text-secondary-400">
            No achievements in this category
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementSystem;