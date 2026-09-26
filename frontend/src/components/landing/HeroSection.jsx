import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import { 
  PlayIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const HeroSection = () => {
  const stats = [
    { label: 'Active Users', value: '50K+' },
    { label: 'Tasks Completed', value: '2M+' },
    { label: 'Teams', value: '5K+' },
    { label: 'Countries', value: '120+' },
  ];
  
  const features = [
    'Smart task organization',
    'Team collaboration',
    'Advanced analytics',
    'Mobile & desktop apps'
  ];
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-900 dark:to-primary-900/20">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200 dark:bg-primary-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-secondary-200 dark:bg-secondary-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary-300 dark:bg-primary-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-sm font-medium mb-6"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              New: AI-powered task insights
            </motion.div>
            
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-secondary-900 dark:text-white leading-tight mb-6"
            >
              Organize your work,{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                amplify your productivity
              </span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-secondary-600 dark:text-secondary-300 mb-8 max-w-2xl"
            >
              The modern task management platform that adapts to your workflow. 
              Collaborate with your team, track progress, and achieve more with intelligent insights.
            </motion.p>
            
            {/* Feature List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-3 mb-8"
            >
              {features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-success-500 mr-2 flex-shrink-0" />
                  <span className="text-secondary-700 dark:text-secondary-300 text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </motion.div>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <Link to="/signup">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                  rightIcon={<ArrowRightIcon className="w-5 h-5" />}
                >
                  Start Free Trial
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                leftIcon={<PlayIcon className="w-5 h-5" />}
              >
                Watch Demo
              </Button>
            </motion.div>
            
            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center lg:justify-start space-x-6"
            >
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 border-2 border-white dark:border-secondary-900 flex items-center justify-center text-white text-xs font-medium"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <StarIcon key={i} className="w-4 h-4 text-warning-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Loved by 50,000+ users
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Main Dashboard Mockup */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 overflow-hidden"
              >
                {/* Mockup Header */}
                <div className="bg-secondary-50 dark:bg-secondary-900 px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-error-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 bg-secondary-200 dark:bg-secondary-700 rounded-lg px-3 py-1">
                      <span className="text-xs text-secondary-500 dark:text-secondary-400">
                        taskly.app/dashboard
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Mockup Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                        Today's Tasks
                      </h3>
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg"></div>
                    </div>
                    
                    {/* Task Items */}
                    {[
                      { title: 'Review project proposal', status: 'completed', priority: 'high' },
                      { title: 'Team standup meeting', status: 'in-progress', priority: 'medium' },
                      { title: 'Update documentation', status: 'pending', priority: 'low' },
                    ].map((task, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg"
                      >
                        <div className={`w-4 h-4 rounded-full ${
                          task.status === 'completed' ? 'bg-success-500' :
                          task.status === 'in-progress' ? 'bg-primary-500' :
                          'bg-secondary-300 dark:bg-secondary-600'
                        }`}></div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            task.status === 'completed' 
                              ? 'line-through text-secondary-500 dark:text-secondary-400' 
                              : 'text-secondary-900 dark:text-secondary-100'
                          }`}>
                            {task.title}
                          </p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === 'high' ? 'bg-error-500' :
                          task.priority === 'medium' ? 'bg-warning-500' :
                          'bg-success-500'
                        }`}></div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Floating Elements */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -top-4 -right-4 bg-success-500 text-white rounded-full p-3 shadow-lg"
              >
                <CheckCircleIcon className="w-6 h-6" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-primary-500 text-white rounded-lg p-3 shadow-lg"
              >
                <div className="text-xs font-medium">+25%</div>
                <div className="text-xs opacity-90">Productivity</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-20 pt-12 border-t border-secondary-200 dark:border-secondary-700"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;