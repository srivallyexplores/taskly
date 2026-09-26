import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ChartBarIcon,
  UsersIcon,
  ArrowRightIcon,
  SparklesIcon,
  Bars3Icon,
  XMarkIcon,
  PlayIcon,
  StarIcon,
  ShieldCheckIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  CogIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SafeImage from '../components/common/SafeImage';

const Home = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Define testimonials array first
  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'CEO, TechStart',
      avatar: '/img/placeholder-user.png',
      content: 'Taskly transformed how our team works. We\'ve increased productivity by 40% and never miss deadlines anymore.',
      rating: 5
    },
    {
      name: 'Maria Rodriguez',
      role: 'Project Manager, DesignCo',
      avatar: '/img/placeholder-user.png',
      content: 'The best task management tool I\'ve ever used. The interface is intuitive and the analytics are incredibly helpful.',
      rating: 5
    },
    {
      name: 'David Kim',
      role: 'Freelance Developer',
      avatar: '/img/placeholder-user.png',
      content: 'As a freelancer, Taskly helps me stay organized across multiple projects. It\'s like having a personal assistant.',
      rating: 5
    }
  ];



  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Redirect authenticated users to dashboard (after all hooks are called)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: CheckCircleIcon,
      title: 'Smart Task Management',
      description: 'AI-powered task organization with intelligent prioritization and deadline management.',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      icon: BoltIcon,
      title: 'Lightning Fast',
      description: 'Optimized performance with instant sync across all your devices and platforms.',
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Deep insights into your productivity patterns with beautiful, actionable reports.',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: UsersIcon,
      title: 'Team Collaboration',
      description: 'Seamless teamwork with real-time collaboration and smart assignment features.',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile First',
      description: 'Native mobile experience with offline support and push notifications.',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Bank-level security with end-to-end encryption and compliance standards.',
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '2M+', label: 'Tasks Completed' },
    { number: '99.9%', label: 'Uptime' },
    { number: '4.9/5', label: 'User Rating' }
  ];

  const navigation = [
    { name: 'Features', href: '#features' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md shadow-sm border-b border-secondary-200/50 dark:border-secondary-700/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="relative">
                  <SparklesIcon className="h-8 w-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
                  <div className="absolute -inset-1 bg-primary-600/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                  Taskly
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6 space-x-3">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 p-2 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 block px-3 py-2 rounded-lg text-base font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="pt-4 pb-3 border-t border-secondary-200 dark:border-secondary-700">
                  {user ? (
                    <Link
                      to="/dashboard"
                      className="bg-gradient-to-r from-primary-600 to-primary-700 text-white block px-3 py-2 rounded-lg text-base font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 block px-3 py-2 rounded-lg text-base font-medium transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        className="bg-gradient-to-r from-primary-600 to-primary-700 text-white block px-3 py-2 rounded-lg text-base font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-900 dark:to-secondary-800 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-grid-pattern opacity-5"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
                <SparklesIcon className="w-4 h-4 mr-2" />
                #1 Task Management Platform
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-secondary-900 dark:text-secondary-100 mb-8 leading-tight">
                Organize Your
                <span className="block bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
                  Productivity
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-secondary-600 dark:text-secondary-400 mb-10 max-w-2xl leading-relaxed">
                Transform the way you work with Taskly's intelligent task management. 
                Boost productivity by <span className="font-semibold text-primary-600">40%</span> and never miss a deadline again.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    Go to Dashboard
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      Start Free Trial
                      <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button 
                      onClick={() => setShowVideoModal(true)}
                      className="group inline-flex items-center px-8 py-4 border-2 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 font-semibold rounded-xl hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300"
                    >
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Watch Demo
                    </button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="text-center lg:text-left"
                  >
                    <div className="text-2xl lg:text-3xl font-bold text-secondary-900 dark:text-secondary-100">
                      {stat.number}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative" 
            >
              <div className="relative z-10">
                <div className="bg-white dark:bg-secondary-800 rounded-3xl shadow-2xl p-8 border border-secondary-200 dark:border-secondary-700">
                  {/* Organize Your Productivity */}
                  <SafeImage
                    src="/img/home.png"
                    fallbackSrc="/img/placeholder-user.png"
                    className="w-full h-auto rounded-2xl"
                    alt="Taskly Dashboard Preview - Organize Your Productivity"
                    width="600"
                    height="400"
                  />
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 -right-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-xl z-20"
              >
                <CheckCircleIcon className="w-8 h-8" />
              </motion.div>
              
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-6 -left-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-2xl shadow-xl z-20"
              >
                <ChartBarIcon className="w-8 h-8" />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [-8, 8, -8],
                  rotate: [0, 5, 0, -5, 0]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-1/4 -right-8 bg-gradient-to-r from-purple-500 to-pink-600 text-white p-3 rounded-xl shadow-xl z-20"
              >
                <UsersIcon className="w-6 h-6" />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [8, -8, 8],
                  x: [-5, 5, -5]
                }}
                transition={{ duration: 4.5, repeat: Infinity }}
                className="absolute top-1/2 -left-8 bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-3 rounded-xl shadow-xl z-20"
              >
                <BoltIcon className="w-6 h-6" />
              </motion.div>

              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute bottom-1/4 -right-6 bg-gradient-to-r from-red-500 to-rose-600 text-white p-3 rounded-xl shadow-xl z-20"
              >
                <FireIcon className="w-6 h-6" />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [-6, 6, -6],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute top-12 -left-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-2.5 rounded-lg shadow-xl z-20"
              >
                <ClockIcon className="w-5 h-5" />
              </motion.div>

              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.15, 1]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute bottom-12 right-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2.5 rounded-lg shadow-xl z-20"
              >
                <ShieldCheckIcon className="w-5 h-5" />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [5, -5, 5],
                  x: [3, -3, 3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-3/4 left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-2.5 rounded-lg shadow-xl z-20"
              >
                <DevicePhoneMobileIcon className="w-5 h-5" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
              Powerful Features for
              <span className="block bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                Modern Teams
              </span>
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Everything you need to manage tasks, collaborate with your team, and boost productivity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative bg-white dark:bg-secondary-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600"
                >
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`w-8 h-8 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-800 dark:to-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
              Loved by Teams
              <span className="block bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                Worldwide
              </span>
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              See what our users are saying about their productivity transformation.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-secondary-800 rounded-3xl p-8 lg:p-12 shadow-2xl border border-secondary-200 dark:border-secondary-700"
            >
              <div className="flex items-center mb-6">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <StarIcon key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-2xl lg:text-3xl font-medium text-secondary-900 dark:text-secondary-100 mb-8 leading-relaxed">
                "{testimonials[activeTestimonial].content}"
              </blockquote>
              
              <div className="flex items-center">
                <SafeImage
                  src={testimonials[activeTestimonial].avatar}
                  fallbackSrc="/img/placeholder-user.png"
                  className="w-16 h-16 rounded-full object-cover mr-4"
                  alt={testimonials[activeTestimonial].name}
                  width="64"
                  height="64"
                />
                <div>
                  <div className="font-bold text-secondary-900 dark:text-secondary-100 text-lg">
                    {testimonials[activeTestimonial].name}
                  </div>
                  <div className="text-secondary-600 dark:text-secondary-400">
                    {testimonials[activeTestimonial].role}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeTestimonial
                      ? 'bg-primary-600 w-8'
                      : 'bg-secondary-300 dark:bg-secondary-600 hover:bg-primary-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Productivity Insights Section */}
      <section className="py-24 bg-white dark:bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
              Proven Results That
              <span className="block bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                Drive Success
              </span>
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Join thousands of professionals who have transformed their productivity with Taskly's intelligent task management system
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">40%</div>
              <div className="text-secondary-600 dark:text-secondary-400">Increase in Productivity</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <ClockIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">2.5h</div>
              <div className="text-secondary-600 dark:text-secondary-400">Time Saved Daily</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">95%</div>
              <div className="text-secondary-600 dark:text-secondary-400">Task Completion Rate</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <FireIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">30+</div>
              <div className="text-secondary-600 dark:text-secondary-400">Day Average Streak</div>
            </motion.div>
          </div>

          {/* Success Stories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white to-secondary-50 dark:from-secondary-800 dark:to-secondary-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-secondary-200 dark:border-secondary-700"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h4 className="font-bold text-secondary-900 dark:text-secondary-100">Sarah Chen</h4>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">Product Manager</p>
                </div>
              </div>
              <p className="text-secondary-700 dark:text-secondary-300 italic">
                "Taskly helped me organize my team's workflow and increase our delivery speed by 60%. The analytics feature is a game-changer!"
              </p>
              <div className="flex items-center mt-4 text-sm text-secondary-500 dark:text-secondary-400">
                <CheckCircleIcon className="w-4 h-4 mr-2 text-emerald-500" />
                <span>1,247 tasks completed</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white to-secondary-50 dark:from-secondary-800 dark:to-secondary-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-secondary-200 dark:border-secondary-700"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h4 className="font-bold text-secondary-900 dark:text-secondary-100">Marcus Johnson</h4>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">Freelance Developer</p>
                </div>
              </div>
              <p className="text-secondary-700 dark:text-secondary-300 italic">
                "As a freelancer managing multiple clients, Taskly keeps me organized and helps me meet every deadline. My productivity has never been higher!"
              </p>
              <div className="flex items-center mt-4 text-sm text-secondary-500 dark:text-secondary-400">
                <FireIcon className="w-4 h-4 mr-2 text-orange-500" />
                <span>45-day streak</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white to-secondary-50 dark:from-secondary-800 dark:to-secondary-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-secondary-200 dark:border-secondary-700"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h4 className="font-bold text-secondary-900 dark:text-secondary-100">Alex Rivera</h4>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">Marketing Director</p>
                </div>
              </div>
              <p className="text-secondary-700 dark:text-secondary-300 italic">
                "The visual progress tracking and analytics in Taskly transformed how our marketing team operates. We're more efficient than ever!"
              </p>
              <div className="flex items-center mt-4 text-sm text-secondary-500 dark:text-secondary-400">
                <ChartBarIcon className="w-4 h-4 mr-2 text-purple-500" />
                <span>98% completion rate</span>
              </div>
            </motion.div>
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link
              to="/signup"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Your Success Story
              <ArrowRightIcon className="ml-2 w-5 h-5" />
            </Link>
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-4">
              Join over 10,000+ professionals already using Taskly
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your
              <span className="block">Productivity?</span>
            </h2>
            <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join over 50,000 users who have already improved their workflow with Taskly. 
              Start your free trial today.
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/signup"
                  className="group inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Start Free Trial
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button 
                  onClick={() => setShowVideoModal(true)}
                  className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:border-white hover:bg-white/10 transition-all duration-300"
                >
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-secondary-900 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <SparklesIcon className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-white">
                  Taskly
                </span>
              </div>
              <p className="text-secondary-400 mb-6 max-w-md leading-relaxed">
                Transform the way you work with Taskly's intelligent task management. 
                Boost productivity and never miss a deadline again.
              </p>
              <div className="flex space-x-4">
                {/* Social Links */}
                <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-secondary-400 hover:text-primary-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-secondary-400 hover:text-primary-400 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link to="/login" className="text-secondary-400 hover:text-primary-400 transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-secondary-400 hover:text-primary-400 transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-6">Support</h3>
              <ul className="space-y-3">
                <li className="text-secondary-400">
                  support@taskly.com
                </li>
                <li className="text-secondary-400">
                  1-800-TASKLY
                </li>
                <li>
                  <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-secondary-800 mt-12 pt-8 text-center">
            <p className="text-secondary-400">
              © 2026 Taskly. All rights reserved. Built with for productivity.
            </p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowVideoModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-5xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-primary-400 transition-colors"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            <div className="bg-secondary-900 rounded-2xl overflow-hidden shadow-2xl">
              <video
                controls
                autoPlay
                className="w-full h-auto"
                poster="/img/home.png"
              >
                <source src="/TasklyVideoShowcase.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Home;