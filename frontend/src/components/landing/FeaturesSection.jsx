import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquareIcon,
  ChartBarIcon,
  UsersIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const FeaturesSection = () => {
  const features = [
    {
      icon: CheckSquareIcon,
      title: 'Smart Task Management',
      description: 'Organize tasks with intelligent categorization, priority levels, and automated scheduling.',
      color: 'bg-primary-500',
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Track productivity trends, completion rates, and team performance with detailed insights.',
      color: 'bg-success-500',
      gradient: 'from-success-500 to-success-600',
    },
    {
      icon: UsersIcon,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with real-time updates, comments, and shared workspaces.',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Cross-Platform Sync',
      description: 'Access your tasks anywhere with native mobile apps and web interface synchronization.',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      icon: ClockIcon,
      title: 'Time Tracking',
      description: 'Monitor time spent on tasks with built-in timers and productivity reports.',
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Bank-level security with end-to-end encryption and compliance certifications.',
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600',
    },
    {
      icon: BoltIcon,
      title: 'Automation',
      description: 'Automate repetitive tasks with smart rules, templates, and workflow triggers.',
      color: 'bg-yellow-500',
      gradient: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Access',
      description: 'Work from anywhere with offline support and multi-language interface.',
      color: 'bg-teal-500',
      gradient: 'from-teal-500 to-teal-600',
    },
    {
      icon: SparklesIcon,
      title: 'AI Insights',
      description: 'Get personalized productivity recommendations powered by machine learning.',
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-indigo-600',
    },
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };
  
  return (
    <section className="py-20 bg-white dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
            Everything you need to stay{' '}
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              organized
            </span>
          </h2>
          <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
            Powerful features designed to help individuals and teams achieve more. 
            From simple task lists to complex project management.
          </p>
        </motion.div>
        
        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative"
              >
                <div className="relative p-8 bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}></div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-300 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Hover Arrow */}
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-secondary-600 dark:text-secondary-300 mb-6">
            Ready to transform your productivity?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200">
              Start Free Trial
            </button>
            <button className="px-8 py-3 border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 font-medium rounded-lg transition-colors duration-200">
              Schedule Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;