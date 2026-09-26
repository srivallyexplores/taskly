import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  CheckIcon,
  CalendarIcon,
  ChartBarIcon,
  UsersIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTeam } from '../../context/TeamContext';
import { useProject } from '../../context/ProjectContext';
import NotificationBell from '../notifications/NotificationBell';

const Navigation = ({ onSearchOpen, onQuickAction }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, getThemeIcon, getThemeLabel, isDark } = useTheme();
  const { teams, currentTeam } = useTeam();
  const { projects } = useProject();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    teams: false,
    projects: false
  });
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      //console.error('Logout failed:', error);
    }
  };
  
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Tasks', href: '/tasks', icon: CheckIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Teams', href: '/teams', icon: UsersIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Find Users', href: '/find-users', icon: UsersIcon },
    { name: 'Invitations', href: '/invitations', icon: EnvelopeIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };
  
  const NavItem = ({ item, mobile = false, isSubItem = false }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    
    const baseClasses = mobile
      ? `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isSubItem ? 'ml-4' : ''}`
      : `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isSubItem ? 'ml-4' : ''}`;
    
    const activeClasses = active
      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-secondary-100';
    
    return (
      <Link
        to={item.href}
        className={`${baseClasses} ${activeClasses}`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        <Icon className={`${mobile ? 'w-5 h-5' : 'w-4 h-4'} mr-3 flex-shrink-0`} />
        <span className="truncate">{item.name}</span>
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className="ml-auto w-2 h-2 bg-primary-600 rounded-full"
          />
        )}
      </Link>
    );
  };

  const SectionHeader = ({ title, icon: Icon, expanded, onToggle, mobile = false }) => {
    const baseClasses = mobile
      ? 'flex items-center justify-between px-4 py-2 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider'
      : 'flex items-center justify-between px-3 py-2 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider';
    
    return (
      <button
        onClick={onToggle}
        className={`${baseClasses} hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors`}
      >
        <div className="flex items-center">
          <Icon className="w-4 h-4 mr-2" />
          {title}
        </div>
        {expanded ? (
          <ChevronDownIcon className="w-4 h-4" />
        ) : (
          <ChevronRightIcon className="w-4 h-4" />
        )}
      </button>
    );
  };
  
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-secondary-200 lg:dark:border-secondary-700 lg:bg-white lg:dark:bg-secondary-900">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-secondary-900 dark:text-secondary-100">
                Taskly
              </span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {/* Main Navigation Items */}
            {navigationItems.filter(item => !['Teams', 'Projects'].includes(item.name)).map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
            
            {/* Teams Section */}
            <div className="pt-4">
              <SectionHeader
                title="Teams"
                icon={UsersIcon}
                expanded={expandedSections.teams}
                onToggle={() => toggleSection('teams')}
              />
              
              <AnimatePresence>
                {expandedSections.teams && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1"
                  >
                    <NavItem 
                      item={{ name: 'All Teams', href: '/teams', icon: UsersIcon }} 
                      isSubItem 
                    />
                    {teams?.filter(t => t && t._id && t.name).slice(0, 5).map((team) => (
                      <NavItem
                        key={team._id}
                        item={{
                          name: team.name,
                          href: `/teams/${team._id}`,
                          icon: UsersIcon
                        }}
                        isSubItem
                      />
                    ))}
                    {teams?.length > 5 && (
                      <Link
                        to="/teams"
                        className="flex items-center ml-4 px-3 py-1 text-xs text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
                      >
                        +{teams.length - 5} more teams
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Projects Section */}
            <div className="pt-2">
              <SectionHeader
                title="Projects"
                icon={FolderIcon}
                expanded={expandedSections.projects}
                onToggle={() => toggleSection('projects')}
              />
              
              <AnimatePresence>
                {expandedSections.projects && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1"
                  >
                    <NavItem 
                      item={{ name: 'All Projects', href: '/projects', icon: FolderIcon }} 
                      isSubItem 
                    />
                    {projects?.filter(p => p && p._id && p.name).slice(0, 5).map((project) => (
                      <NavItem
                        key={project._id}
                        item={{
                          name: project.name,
                          href: `/projects/${project._id}`,
                          icon: FolderIcon
                        }}
                        isSubItem
                      />
                    ))}
                    {projects?.length > 5 && (
                      <Link
                        to="/projects"
                        className="flex items-center ml-4 px-3 py-1 text-xs text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
                      >
                        +{projects.length - 5} more projects
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Settings */}
            <div className="pt-4">
              <NavItem item={navigationItems.find(item => item.name === 'Settings')} />
            </div>
          </nav>
          
          {/* User Profile & Theme Toggle */}
          <div className="flex-shrink-0 p-4 border-t border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                leftIcon={
                  getThemeIcon() === 'sun' ? <SunIcon className="w-4 h-4" /> :
                  getThemeIcon() === 'moon' ? <MoonIcon className="w-4 h-4" /> :
                  <ComputerDesktopIcon className="w-4 h-4" />
                }
              >
                {getThemeLabel()}
              </Button>
              <NotificationBell />
            </div>
            
            {user && (
              <>
                <Link to="/profile" className="flex items-center hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-lg p-2 transition-colors mb-2">
                  <img
                    className="w-8 h-8 rounded-full"
                    src={user.avatar || '/img/placeholder-user.png'}
                    alt={user.fullname}
                  />
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {user.fullname}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </Link>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                  className="w-full justify-center"
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <CheckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-secondary-900 dark:text-secondary-100">
              Taskly
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              leftIcon={
                getThemeIcon() === 'sun' ? <SunIcon className="w-4 h-4" /> :
                getThemeIcon() === 'moon' ? <MoonIcon className="w-4 h-4" /> :
                <ComputerDesktopIcon className="w-4 h-4" />
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              leftIcon={isMobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700"
          >
            <nav className="px-4 py-4 space-y-1">
              {/* Main Navigation Items */}
              {navigationItems.filter(item => !['Teams', 'Projects'].includes(item.name)).map((item) => (
                <NavItem key={item.name} item={item} mobile />
              ))}
              
              {/* Teams Section */}
              <div className="pt-4">
                <SectionHeader
                  title="Teams"
                  icon={UsersIcon}
                  expanded={expandedSections.teams}
                  onToggle={() => toggleSection('teams')}
                  mobile
                />
                
                <AnimatePresence>
                  {expandedSections.teams && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-1"
                    >
                      <NavItem 
                        item={{ name: 'All Teams', href: '/teams', icon: UsersIcon }} 
                        mobile 
                        isSubItem 
                      />
                      {teams?.filter(t => t && t._id && t.name).slice(0, 3).map((team) => (
                        <NavItem
                          key={team._id}
                          item={{
                            name: team.name,
                            href: `/teams/${team._id}`,
                            icon: UsersIcon
                          }}
                          mobile
                          isSubItem
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Projects Section */}
              <div className="pt-2">
                <SectionHeader
                  title="Projects"
                  icon={FolderIcon}
                  expanded={expandedSections.projects}
                  onToggle={() => toggleSection('projects')}
                  mobile
                />
                
                <AnimatePresence>
                  {expandedSections.projects && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-1"
                    >
                      <NavItem 
                        item={{ name: 'All Projects', href: '/projects', icon: FolderIcon }} 
                        mobile 
                        isSubItem 
                      />
                      {projects?.slice(0, 3).map((project) => (
                        <NavItem
                          key={project._id}
                          item={{
                            name: project.name,
                            href: `/projects/${project._id}`,
                            icon: FolderIcon
                          }}
                          mobile
                          isSubItem
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Settings */}
              <div className="pt-4">
                <NavItem item={navigationItems.find(item => item.name === 'Settings')} mobile />
              </div>
              
              {user && (
                <div className="pt-4 mt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <Link 
                    to="/profile" 
                    className="flex items-center px-4 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-lg transition-colors mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <img
                      className="w-10 h-10 rounded-full"
                      src={user.avatar || '/img/placeholder-user.png'}
                      alt={user.fullname}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {user.fullname}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-700 z-50">
        <nav className="flex">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex-1 flex flex-col items-center py-2 px-1 text-xs transition-colors duration-200 ${
                  active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-secondary-500 dark:text-secondary-400'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="truncate">{item.name}</span>
                {active && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Navigation;