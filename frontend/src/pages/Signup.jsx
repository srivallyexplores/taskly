import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SafeImage from '../components/common/SafeImage';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: '/img/placeholder-user.png'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const { register, user, loading, error, clearError } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Avatar options
  const avatarOptions = [
    '/img/placeholder-user.png',
    '/img/avatars/avatar-1.jpg',
    '/img/avatars/avatar-2.jpg',
    '/img/avatars/avatar-3.jpg',
    '/img/avatars/avatar-4.jpg',
    '/img/avatars/avatar-5.jpg',
    '/img/avatars/avatar-6.jpg',
    '/img/avatars/avatar-7.jpg',
    '/img/avatars/avatar-8.jpg',
    '/img/avatars/avatar-9.jpg',
    '/img/avatars/avatar-10.jpg',
    '/img/avatars/avatar-11.jpg',
    '/img/avatars/avatar-12.jpg',
    '/img/avatars/avatar-13.jpg'
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading && !isSubmitting) {
      const returnTo = location.state?.from || '/dashboard';
      navigate(returnTo, { replace: true });
    }
  }, [user, loading, isSubmitting, navigate, location.state]);

  const validateForm = () => {
    const newErrors = {};

    // Full name validation
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    } else if (formData.fullname.trim().length < 2) {
      newErrors.fullname = 'Full name must be at least 2 characters';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register(formData);
      showSuccess('Account created successfully! Welcome to Taskly.');
      
      // Navigation is handled by the useEffect above
    } catch (err) {
      //console.error('Registration failed:', err);
      // Error is handled by the AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAvatarSelect = (avatar) => {
    setFormData(prev => ({
      ...prev,
      avatar
    }));
    setShowAvatarSelector(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo and Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center group">
              <div className="relative">
                <SparklesIcon className="h-12 w-12 text-primary-600 group-hover:text-primary-700 transition-colors" />
                <div className="absolute -inset-2 bg-primary-600/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                Taskly
              </span>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-secondary-900 dark:text-secondary-100">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-secondary-800 shadow-2xl rounded-2xl p-8 border border-secondary-200 dark:border-secondary-700"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Global Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <SafeImage
                    src={formData.avatar}
                    fallbackSrc="/img/placeholder-user.png"
                    className="w-16 h-16 rounded-full object-cover border-2 border-secondary-300 dark:border-secondary-600"
                    alt="Selected avatar"
                    width="64"
                    height="64"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  Choose Avatar
                </button>
              </div>
              
              {showAvatarSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 border border-secondary-200 dark:border-secondary-600 rounded-lg bg-secondary-50 dark:bg-secondary-700"
                >
                  <div className="grid grid-cols-6 gap-2">
                    {avatarOptions.map((avatar, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleAvatarSelect(avatar)}
                        className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                          formData.avatar === avatar
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400'
                        }`}
                      >
                        <SafeImage
                          src={avatar}
                          fallbackSrc="/img/placeholder-user.png"
                          className="w-full h-full object-cover"
                          alt={`Avatar option ${index + 1}`}
                          width="48"
                          height="48"
                        />
                        {formData.avatar === avatar && (
                          <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                            <CheckIcon className="w-4 h-4 text-primary-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Full Name Field */}
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Full Name
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                autoComplete="name"
                required
                value={formData.fullname}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-4 py-3 border ${
                  errors.fullname 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-secondary-300 dark:border-secondary-600'
                } placeholder-secondary-500 dark:placeholder-secondary-400 text-secondary-900 dark:text-secondary-100 bg-white dark:bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                placeholder="Enter your full name"
              />
              {errors.fullname && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.fullname}
                </motion.p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-4 py-3 border ${
                  errors.username 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-secondary-300 dark:border-secondary-600'
                } placeholder-secondary-500 dark:placeholder-secondary-400 text-secondary-900 dark:text-secondary-100 bg-white dark:bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                placeholder="Choose a username"
              />
              {errors.username && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.username}
                </motion.p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-4 py-3 border ${
                  errors.email 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-secondary-300 dark:border-secondary-600'
                } placeholder-secondary-500 dark:placeholder-secondary-400 text-secondary-900 dark:text-secondary-100 bg-white dark:bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-4 py-3 pr-12 border ${
                    errors.password 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-secondary-300 dark:border-secondary-600'
                  } placeholder-secondary-500 dark:placeholder-secondary-400 text-secondary-900 dark:text-secondary-100 bg-white dark:bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-4 py-3 pr-12 border ${
                    errors.confirmPassword 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-secondary-300 dark:border-secondary-600'
                  } placeholder-secondary-500 dark:placeholder-secondary-400 text-secondary-900 dark:text-secondary-100 bg-white dark:bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500 transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500 transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Create account</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;