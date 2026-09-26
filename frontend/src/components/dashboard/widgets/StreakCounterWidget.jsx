import React from 'react';
import { motion } from 'framer-motion';
import { DashboardWidget } from '../index';
import { 
  FireIcon, 
  TrophyIcon, 
  CalendarDaysIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

const StreakCounterWidget = ({ 
  currentStreak = 0,
  longestStreak = 0,
  loading = false,
  error = null 
}) => {
  // Sample data if none provided
  const streak = currentStreak || 7;
  const longest = longestStreak || 15;
  
  const getStreakLevel = (streakDays) => {
    if (streakDays >= 30) return { level: 'legendary', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/20' };
    if (streakDays >= 14) return { level: 'epic', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20' };
    if (streakDays >= 7) return { level: 'great', color: 'text-success-600 dark:text-success-400', bg: 'bg-success-100 dark:bg-success-900/20' };
    if (streakDays >= 3) return { level: 'good', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/20' };
    return { level: 'starting', color: 'text-secondary-600 dark:text-secondary-400', bg: 'bg-secondary-100 dark:bg-secondary-800' };
  };
  
  const currentLevel = getStreakLevel(streak);
  const longestLevel = getStreakLevel(longest);
  
  const getMotivationalMessage = (streakDays) => {
    if (streakDays === 0) return "Start your streak today!";
    if (streakDays < 3) return "Keep it up!";
    if (streakDays < 7) return "You're on fire! 🔥";
    if (streakDays < 14) return "Incredible consistency!";
    if (streakDays < 30) return "You're unstoppable!";
    return "Legendary productivity!";
  };
  
  const achievements = [
    { days: 3, icon: FireIcon, label: 'Hot Streak', unlocked: streak >= 3 },
    { days: 7, icon: CalendarDaysIcon, label: 'Week Warrior', unlocked: streak >= 7 },
    { days: 14, icon: SparklesIcon, label: 'Consistency King', unlocked: streak >= 14 },
    { days: 30, icon: TrophyIcon, label: 'Productivity Legend', unlocked: streak >= 30 },
  ];
  
  return (
    <DashboardWidget
      title="Productivity Streak"
      subtitle={getMotivationalMessage(streak)}
      size="sm"
      loading={loading}
      error={error}
    >
      <div className="text-center space-y-4">
        {/* Current Streak Display */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className={`w-20 h-20 mx-auto rounded-full ${currentLevel.bg} flex items-center justify-center relative overflow-hidden`}
          >
            {/* Animated background */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-20"
            >
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent"></div>
            </motion.div>
            
            <div className="relative z-10 text-center">
              <div className={`text-2xl font-bold ${currentLevel.color}`}>
                {streak}
              </div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400">
                days
              </div>
            </div>
          </motion.div>
          
          {/* Streak flame animation */}
          {streak > 0 && (
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="absolute -top-2 -right-2"
            >
              <FireIcon className="w-6 h-6 text-orange-500" />
            </motion.div>
          )}
        </div>
        
        {/* Personal Best */}
        <div className="text-center">
          <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">
            Personal Best
          </div>
          <div className={`text-lg font-semibold ${longestLevel.color}`}>
            {longest} days
          </div>
        </div>
        
        {/* Mini Achievements */}
        <div className="grid grid-cols-2 gap-2">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <motion.div
                key={achievement.days}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-2 rounded-lg text-center transition-all duration-200 ${
                  achievement.unlocked
                    ? 'bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400'
                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-400 dark:text-secondary-500'
                }`}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs font-medium">
                  {achievement.days}d
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Progress to next milestone */}
        {streak < 30 && (
          <div className="mt-4">
            <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-2">
              Next milestone: {achievements.find(a => !a.unlocked)?.days || 30} days
            </div>
            <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min((streak / (achievements.find(a => !a.unlocked)?.days || 30)) * 100, 100)}%` 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-primary-500 to-success-500 h-2 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default StreakCounterWidget;