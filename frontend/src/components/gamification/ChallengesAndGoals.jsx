import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  FireIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
  StarIcon,
  BoltIcon,
  TargetIcon
} from '@heroicons/react/24/outline';
import { Button, Input } from '../ui';

const ChallengesAndGoals = ({ onChallengeComplete, onGoalSet, className = '' }) => {
  const [activeTab, setActiveTab] = useState('challenges');
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [personalGoals, setPersonalGoals] = useState([]);
  
  // Daily/Weekly challenges
  const sampleChallenges = [
    {
      id: 'daily-1',
      type: 'daily',
      title: 'Early Bird',
      description: 'Complete 3 tasks before 10 AM',
      icon: ClockIcon,
      progress: 1,
      target: 3,
      reward: { xp: 50, badge: 'Early Bird' },
      timeLeft: '18h 32m',
      difficulty: 'easy',
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'daily-2',
      type: 'daily',
      title: 'Productivity Sprint',
      description: 'Complete 8 tasks today',
      icon: BoltIcon,
      progress: 3,
      target: 8,
      reward: { xp: 100, badge: 'Sprint Master' },
      timeLeft: '18h 32m',
      difficulty: 'medium',
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'weekly-1',
      type: 'weekly',
      title: 'Consistency Champion',
      description: 'Complete at least 1 task every day this week',
      icon: CalendarIcon,
      progress: 4,
      target: 7,
      reward: { xp: 200, badge: 'Consistent' },
      timeLeft: '3d 18h',
      difficulty: 'medium',
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'weekly-2',
      type: 'weekly',
      title: 'Team Collaboration',
      description: 'Help 5 teammates with their tasks',
      icon: UserGroupIcon,
      progress: 2,
      target: 5,
      reward: { xp: 150, badge: 'Team Player' },
      timeLeft: '3d 18h',
      difficulty: 'hard',
      color: 'from-orange-400 to-orange-600'
    }
  ];
  
  // Personal goals
  const sampleGoals = [
    {
      id: 'goal-1',
      title: 'Complete Website Redesign',
      description: 'Finish all tasks related to the website redesign project',
      category: 'project',
      progress: 12,
      target: 20,
      deadline: new Date('2024-03-15'),
      priority: 'high',
      createdAt: new Date('2024-02-01'),
      milestones: [
        { id: 1, title: 'Design mockups', completed: true },
        { id: 2, title: 'Frontend development', completed: true },
        { id: 3, title: 'Backend integration', completed: false },
        { id: 4, title: 'Testing and deployment', completed: false }
      ]
    },
    {
      id: 'goal-2',
      title: 'Learn React Advanced Patterns',
      description: 'Complete 15 advanced React tutorials and build 3 projects',
      category: 'learning',
      progress: 8,
      target: 15,
      deadline: new Date('2024-04-01'),
      priority: 'medium',
      createdAt: new Date('2024-01-15'),
      milestones: [
        { id: 1, title: 'Hooks mastery', completed: true },
        { id: 2, title: 'Context API', completed: true },
        { id: 3, title: 'Performance optimization', completed: false },
        { id: 4, title: 'Testing patterns', completed: false }
      ]
    }
  ];
  
  useEffect(() => {
    setChallenges(sampleChallenges);
    setPersonalGoals(sampleGoals);
  }, []);
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'hard':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700';
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-secondary-600 dark:text-secondary-400';
    }
  };
  
  const getTimeUntilDeadline = (deadline) => {
    const now = new Date();
    const diff = deadline - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };
  
  const completeChallenge = (challengeId) => {
    setChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId 
        ? { ...challenge, progress: challenge.target }
        : challenge
    ));
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      onChallengeComplete?.(challenge);
    }
  };
  
  const CreateGoalModal = () => {
    const [goalData, setGoalData] = useState({
      title: '',
      description: '',
      category: 'personal',
      target: 10,
      deadline: '',
      priority: 'medium'
    });
    
    const handleSubmit = (e) => {
      e.preventDefault();
      const newGoal = {
        id: `goal-${Date.now()}`,
        ...goalData,
        progress: 0,
        deadline: new Date(goalData.deadline),
        createdAt: new Date(),
        milestones: []
      };
      
      setPersonalGoals(prev => [...prev, newGoal]);
      onGoalSet?.(newGoal);
      setShowCreateGoal(false);
      setGoalData({
        title: '',
        description: '',
        category: 'personal',
        target: 10,
        deadline: '',
        priority: 'medium'
      });
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-700"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Create New Goal
              </h3>
              <button
                onClick={() => setShowCreateGoal(false)}
                className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Goal Title
                </label>
                <Input
                  type="text"
                  value={goalData.title}
                  onChange={(e) => setGoalData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter goal title..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Description
                </label>
                <textarea
                  value={goalData.description}
                  onChange={(e) => setGoalData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal..."
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Category
                  </label>
                  <select
                    value={goalData.category}
                    onChange={(e) => setGoalData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  >
                    <option value="personal">Personal</option>
                    <option value="project">Project</option>
                    <option value="learning">Learning</option>
                    <option value="health">Health</option>
                    <option value="career">Career</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Target
                  </label>
                  <Input
                    type="number"
                    value={goalData.target}
                    onChange={(e) => setGoalData(prev => ({ ...prev, target: parseInt(e.target.value) }))}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Deadline
                  </label>
                  <Input
                    type="date"
                    value={goalData.deadline}
                    onChange={(e) => setGoalData(prev => ({ ...prev, deadline: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={goalData.priority}
                    onChange={(e) => setGoalData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  Create Goal
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowCreateGoal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  };
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Challenges & Goals
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <TargetIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-secondary-100 dark:bg-secondary-700 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'challenges'
              ? 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 shadow-sm'
              : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
          }`}
        >
          Daily & Weekly Challenges
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'goals'
              ? 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 shadow-sm'
              : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
          }`}
        >
          Personal Goals
        </button>
      </div>
      
      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          {challenges.map((challenge, index) => {
            const Icon = challenge.icon;
            const isCompleted = challenge.progress >= challenge.target;
            const progressPercentage = (challenge.progress / challenge.target) * 100;
            
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isCompleted
                    ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/10'
                    : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${challenge.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                          {challenge.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          challenge.type === 'daily' 
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20'
                            : 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20'
                        }`}>
                          {challenge.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-secondary-500 dark:text-secondary-400">
                          {challenge.timeLeft}
                        </span>
                        {isCompleted && (
                          <CheckCircleIcon className="w-5 h-5 text-success-500" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3">
                      {challenge.description}
                    </p>
                    
                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-secondary-600 dark:text-secondary-400">
                          Progress: {challenge.progress} / {challenge.target}
                        </span>
                        <span className="text-secondary-600 dark:text-secondary-400">
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary-200 dark:bg-secondary-600 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`h-2 rounded-full bg-gradient-to-r ${challenge.color}`}
                        />
                      </div>
                    </div>
                    
                    {/* Reward */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-secondary-500 dark:text-secondary-400">
                        <span>Reward: {challenge.reward.xp} XP</span>
                        {challenge.reward.badge && (
                          <span>Badge: {challenge.reward.badge}</span>
                        )}
                      </div>
                      
                      {!isCompleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => completeChallenge(challenge.id)}
                          className="text-xs"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateGoal(true)}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </div>
          
          {personalGoals.map((goal, index) => {
            const progressPercentage = (goal.progress / goal.target) * 100;
            const timeLeft = getTimeUntilDeadline(goal.deadline);
            const completedMilestones = goal.milestones.filter(m => m.completed).length;
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
                      {goal.title}
                    </h4>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">
                      {goal.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      goal.category === 'project' ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20' :
                      goal.category === 'learning' ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20' :
                      'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
                    }`}>
                      {goal.category}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-secondary-600 dark:text-secondary-400">
                      Progress: {goal.progress} / {goal.target}
                    </span>
                    <span className="text-secondary-600 dark:text-secondary-400">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 dark:bg-secondary-600 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                    />
                  </div>
                </div>
                
                {/* Milestones */}
                {goal.milestones.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-secondary-600 dark:text-secondary-400 mb-2">
                      Milestones ({completedMilestones} / {goal.milestones.length})
                    </div>
                    <div className="space-y-1">
                      {goal.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center space-x-2">
                          <CheckCircleIcon className={`w-3 h-3 ${
                            milestone.completed 
                              ? 'text-success-500' 
                              : 'text-secondary-300 dark:text-secondary-600'
                          }`} />
                          <span className={`text-xs ${
                            milestone.completed 
                              ? 'text-secondary-900 dark:text-secondary-100 line-through' 
                              : 'text-secondary-600 dark:text-secondary-400'
                          }`}>
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400">
                  <span>Created {goal.createdAt.toLocaleDateString()}</span>
                  <span className={timeLeft === 'Overdue' ? 'text-red-600 dark:text-red-400' : ''}>
                    {timeLeft}
                  </span>
                </div>
              </motion.div>
            );
          })}
          
          {personalGoals.length === 0 && (
            <div className="text-center py-8">
              <TargetIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
              <p className="text-secondary-500 dark:text-secondary-400">
                No personal goals set
              </p>
              <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                Create your first goal to start tracking progress
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Create Goal Modal */}
      <AnimatePresence>
        {showCreateGoal && <CreateGoalModal />}
      </AnimatePresence>
    </div>
  );
};

export default ChallengesAndGoals;