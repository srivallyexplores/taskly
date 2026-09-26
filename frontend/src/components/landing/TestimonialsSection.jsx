import React from 'react';
import { motion } from 'framer-motion';
import { StarIcon, QuoteIcon } from '@heroicons/react/24/solid';

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Product Manager',
      company: 'TechCorp',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      content: 'Taskly has completely transformed how our team manages projects. The intuitive interface and powerful collaboration features have increased our productivity by 40%.',
      rating: 5,
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      role: 'Freelance Designer',
      company: 'Independent',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      content: 'As a freelancer juggling multiple clients, Taskly keeps me organized and on track. The time tracking and analytics features are game-changers for my business.',
      rating: 5,
    },
    {
      id: 3,
      name: 'Emily Johnson',
      role: 'Engineering Lead',
      company: 'StartupXYZ',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      content: 'The automation features in Taskly have saved our team countless hours. We can focus on what matters most while the platform handles the routine tasks.',
      rating: 5,
    },
    {
      id: 4,
      name: 'David Park',
      role: 'Operations Director',
      company: 'Global Solutions',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      content: 'Managing a distributed team across multiple time zones was challenging until we found Taskly. Now everyone stays aligned and productive.',
      rating: 5,
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      role: 'Marketing Manager',
      company: 'Creative Agency',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      content: 'The visual project boards and real-time updates make it easy to keep campaigns on track. Our clients love the transparency Taskly provides.',
      rating: 5,
    },
    {
      id: 6,
      name: 'James Wilson',
      role: 'Startup Founder',
      company: 'InnovateLab',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      content: 'Taskly scales with our growing team perfectly. From 5 to 50 employees, it has remained our go-to tool for staying organized and efficient.',
      rating: 5,
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
    <section className="py-20 bg-secondary-50 dark:bg-secondary-800">
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
            Loved by teams{' '}
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              worldwide
            </span>
          </h2>
          <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
            Join thousands of satisfied users who have transformed their productivity with Taskly.
          </p>
          
          {/* Overall Rating */}
          <div className="flex items-center justify-center mt-8 space-x-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} className="w-5 h-5 text-warning-400" />
              ))}
            </div>
            <span className="text-lg font-semibold text-secondary-900 dark:text-white">4.9</span>
            <span className="text-secondary-600 dark:text-secondary-400">
              (2,847 reviews)
            </span>
          </div>
        </motion.div>
        
        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              variants={itemVariants}
              className="group"
            >
              <div className="relative p-6 bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl h-full">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <QuoteIcon className="w-8 h-8 text-primary-600" />
                </div>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`w-4 h-4 ${
                        star <= testimonial.rating
                          ? 'text-warning-400'
                          : 'text-secondary-300 dark:text-secondary-600'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Content */}
                <blockquote className="text-secondary-700 dark:text-secondary-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </blockquote>
                
                {/* Author */}
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-secondary-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 pt-12 border-t border-secondary-200 dark:border-secondary-700"
        >
          <div className="text-center mb-8">
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              Trusted by leading companies worldwide
            </p>
          </div>
          
          {/* Company Logos */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60 hover:opacity-80 transition-opacity duration-300">
            {[
              'TechCorp', 'StartupXYZ', 'Global Solutions', 
              'Creative Agency', 'InnovateLab', 'Enterprise Co'
            ].map((company, index) => (
              <div
                key={index}
                className="flex items-center justify-center h-12 text-secondary-500 dark:text-secondary-400 font-semibold"
              >
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;