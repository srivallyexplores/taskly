import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  SparklesIcon,
  ChartBarIcon,
  UsersIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Taskly!',
    description: 'Let\'s get you set up with everything you need to boost your productivity.',
    icon: SparklesIcon,
    content: 'WelcomeStep'
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Tell us a bit about yourself to personalize your experience.',
    icon: CheckIcon,
    content: 'ProfileStep'
  },
  {
    id: 'preferences',
    title: 'Set Your Preferences',
    description: 'Customize Taskly to match your workflow and style.',
    icon: CogIcon,
    content: 'PreferencesStep'
  },
  {
    id: 'first-task',
    title: 'Create Your First Task',
    description: 'Let\'s start with creating your first task to get familiar with the interface.',
    icon: CheckIcon,
    content: 'FirstTaskStep'
  },
  {
    id: 'features',
    title: 'Explore Key Features',
    description: 'Discover the powerful features that will help you stay organized.',
    icon: ChartBarIcon,
    content: 'FeaturesStep'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Welcome to your new productivity hub. Let\'s get started!',
    icon: CheckIcon,
    content: 'CompleteStep'
  }
];

// Welcome Step Component
const WelcomeStep = ({ onNext }) => (
  <div className="text-center">
    <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
      <SparklesIcon className="w-12 h-12 text-white" />
    </div>
    
    <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
      Welcome to Taskly!
    </h2>
    
    <p className="text-secondary-600 dark:text-secondary-400 mb-8 max-w-md mx-auto">
      We're excited to help you organize your tasks, boost your productivity, and achieve your goals. 
      This quick setup will take just a few minutes.
    </p>
    
    <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
      <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
        <CheckIcon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Task Management</p>
      </div>
      <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
        <ChartBarIcon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Analytics</p>
      </div>
      <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
        <UsersIcon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Collaboration</p>
      </div>
      <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
        <CogIcon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Customization</p>
      </div>
    </div>
    
    <Button onClick={onNext} size="lg" className="w-full max-w-xs">
      Let's Get Started
      <ArrowRightIcon className="w-4 h-4 ml-2" />
    </Button>
  </div>
);

// Profile Step Component
const ProfileStep = ({ onNext, onPrev }) => {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [formData, setFormData] = useState({
    fullname: user?.fullname || '',
    jobTitle: user?.jobTitle || '',
    company: user?.company || '',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // Sync form when user data becomes available (e.g. after auth loads)
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        fullname: user.fullname || prev.fullname,
        jobTitle: user.jobTitle || prev.jobTitle,
        company: user.company || prev.company,
        timezone: user.timezone || prev.timezone
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      // Persist the profile fields to the backend before advancing
      await updateProfile({
        fullname: formData.fullname,
        jobTitle: formData.jobTitle,
        company: formData.company,
        timezone: formData.timezone
      });
      onNext();
    } catch (err) {
      setSaveError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          Complete Your Profile
        </h2>
        <p className="text-secondary-600 dark:text-secondary-400">
          Help us personalize your experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {saveError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-2">
            {saveError}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullname}
            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            Job Title
          </label>
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
            placeholder="e.g. Product Manager"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
            placeholder="Enter your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onPrev} className="flex-1" disabled={saving}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving...' : 'Continue'}
            {!saving && <ArrowRightIcon className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Preferences Step Component
const PreferencesStep = ({ onNext, onPrev }) => {
  const [preferences, setPreferences] = useState({
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      desktop: true
    },
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    weekStart: 'monday'
  });

  const handleSubmit = () => {
    // Save preferences
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    onNext();
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CogIcon className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          Set Your Preferences
        </h2>
        <p className="text-secondary-600 dark:text-secondary-400">
          Customize Taskly to match your workflow
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Theme Preference
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['light', 'dark', 'system'].map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => setPreferences({ ...preferences, theme })}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  preferences.theme === theme
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-600 hover:border-secondary-300'
                }`}
              >
                <div className="text-sm font-medium capitalize">{theme}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Notifications
          </label>
          <div className="space-y-2">
            {Object.entries(preferences.notifications).map(([key, value]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: {
                      ...preferences.notifications,
                      [key]: e.target.checked
                    }
                  })}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300 capitalize">
                  {key} notifications
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Working Hours
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-secondary-500 mb-1">Start</label>
              <input
                type="time"
                value={preferences.workingHours.start}
                onChange={(e) => setPreferences({
                  ...preferences,
                  workingHours: {
                    ...preferences.workingHours,
                    start: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary-500 mb-1">End</label>
              <input
                type="time"
                value={preferences.workingHours.end}
                onChange={(e) => setPreferences({
                  ...preferences,
                  workingHours: {
                    ...preferences.workingHours,
                    end: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button variant="outline" onClick={onPrev} className="flex-1">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Continue
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// First Task Step Component
const FirstTaskStep = ({ onNext, onPrev }) => {
  const [taskTitle, setTaskTitle] = useState('');

  const handleCreateTask = () => {
    if (taskTitle.trim()) {
      // Task will be created in the main app after onboarding
      localStorage.setItem('firstTask', taskTitle);
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-10 h-10 text-primary-600" />
        </div>
        <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          Create Your First Task
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400">
          Start by adding a task you want to accomplish today.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
          What do you want to accomplish?
        </label>
        <input
          type="text"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="e.g., Complete project proposal"
          className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="bg-primary-50 dark:bg-primary-900/10 rounded-lg p-4">
        <p className="text-sm text-primary-800 dark:text-primary-200">
          💡 <strong>Tip:</strong> Keep your tasks specific and actionable. You can add more details like due dates and priorities later!
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onPrev} className="flex-1">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleCreateTask} disabled={!taskTitle.trim()} className="flex-1">
          Continue
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Features Step Component
const FeaturesStep = ({ onNext, onPrev }) => {
  const features = [
    {
      icon: CheckIcon,
      title: 'Task Management',
      description: 'Create, organize, and track your tasks with ease'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics',
      description: 'Track your productivity and see your progress over time'
    },
    {
      icon: UsersIcon,
      title: 'Team Collaboration',
      description: 'Work together with teams and share projects'
    },
    {
      icon: SparklesIcon,
      title: 'Smart Calendar',
      description: 'Visualize your tasks and schedule with calendar views'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          Explore Key Features
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400">
          Here's what you can do with Taskly
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700"
          >
            <feature.icon className="w-8 h-8 text-primary-600 mb-3" />
            <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
              {feature.title}
            </h4>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="secondary" onClick={onPrev} className="flex-1">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Complete Step Component
const CompleteStep = ({ onComplete }) => (
  <div className="text-center">
    <div className="w-24 h-24 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckIcon className="w-12 h-12 text-white" />
    </div>
    
    <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
      You're All Set!
    </h2>
    
    <p className="text-secondary-600 dark:text-secondary-400 mb-8 max-w-md mx-auto">
      Welcome to your new productivity hub! You can always change these settings later in your profile.
    </p>
    
    <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-6 mb-8 max-w-md mx-auto">
      <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
        Quick Tips to Get Started:
      </h3>
      <ul className="text-sm text-secondary-600 dark:text-secondary-400 space-y-2 text-left">
        <li>• Create your first task using the "+" button</li>
        <li>• Explore different views: List, Board, Calendar</li>
        <li>• Set up your first project to organize tasks</li>
        <li>• Check out the Analytics page for insights</li>
      </ul>
    </div>
    
    <Button onClick={onComplete} size="lg" className="w-full max-w-xs">
      Start Using Taskly
      <ArrowRightIcon className="w-4 h-4 ml-2" />
    </Button>
  </div>
);

// Main Onboarding Flow Component
const OnboardingFlow = ({ onComplete }) => {
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isVisible, setIsVisible] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage('hasCompletedOnboarding', false);

  // Resume from the user's saved onboarding progress once user data loads.
  useEffect(() => {
    if (user?.onboarding) {
      const { currentStep: savedStep, completedSteps: savedCompleted } = user.onboarding;
      if (typeof savedStep === 'number' && savedStep > 0 && savedStep < ONBOARDING_STEPS.length) {
        setCurrentStep(savedStep);
      }
      if (Array.isArray(savedCompleted) && savedCompleted.length > 0) {
        setCompletedSteps(new Set(savedCompleted));
      }
    }
  }, [user]);

  // Drive the "already completed" gate from the server-side flag, falling
  // back to the local flag for offline / pre-migration users.
  const alreadyCompleted = user?.onboarding?.completed || hasCompletedOnboarding;
  if (alreadyCompleted) {
    return null;
  }

  const currentStepData = ONBOARDING_STEPS[currentStep];

  // Persist onboarding progress to user.onboarding on the backend. Never
  // throws so navigation is not blocked if the save fails.
  const persistProgress = async (progress) => {
    try {
      await updateProfile({ onboarding: progress });
    } catch (e) {
      // Progress persistence is best-effort; continue the flow regardless.
    }
  };

  const handleNext = () => {
    const nextCompleted = new Set([...completedSteps, currentStep]);
    setCompletedSteps(nextCompleted);

    const nextStep = currentStep < ONBOARDING_STEPS.length - 1 ? currentStep + 1 : currentStep;
    if (nextStep !== currentStep) {
      setCurrentStep(nextStep);
    }

    persistProgress({
      currentStep: nextStep,
      completedSteps: Array.from(nextCompleted),
      completed: false
    });
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = () => {
    const finalCompleted = new Set([...completedSteps, currentStep]);
    setHasCompletedOnboarding(true);
    setIsVisible(false);
    persistProgress({
      currentStep: ONBOARDING_STEPS.length - 1,
      completedSteps: Array.from(finalCompleted),
      completed: true
    });
    if (onComplete) {
      onComplete();
    }
  };

  const handleComplete = () => {
    finishOnboarding();
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const renderStepContent = () => {
    // Guard: until user data has loaded, only steps that don't depend on user
    // data should render their full form. This prevents a blank step (e.g.
    // "Step 4") when the user object is momentarily null during auth bootstrap.
    if (!currentStepData) {
      return <div>Step content not found</div>;
    }

    switch (currentStepData.content) {
      case 'WelcomeStep':
        return <WelcomeStep onNext={handleNext} />;
      case 'ProfileStep':
        return <ProfileStep onNext={handleNext} onPrev={handlePrev} />;
      case 'PreferencesStep':
        return <PreferencesStep onNext={handleNext} onPrev={handlePrev} />;
      case 'FirstTaskStep':
        return <FirstTaskStep onNext={handleNext} onPrev={handlePrev} />;
      case 'FeaturesStep':
        return <FeaturesStep onNext={handleNext} onPrev={handlePrev} />;
      case 'CompleteStep':
        return <CompleteStep onComplete={handleComplete} />;
      default:
        return <div>Step content not found</div>;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1">
                {ONBOARDING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-primary-600'
                        : completedSteps.has(index)
                        ? 'bg-success-500'
                        : 'bg-secondary-300 dark:bg-secondary-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">
                Step {currentStep + 1} of {ONBOARDING_STEPS.length}
              </span>
            </div>
            
            <button
              onClick={handleSkip}
              className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          {currentStep < ONBOARDING_STEPS.length - 1 && (
            <div className="px-6 pb-6">
              <button
                onClick={handleSkip}
                className="text-sm text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors"
              >
                Skip onboarding
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingFlow;