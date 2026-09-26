import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  StarIcon,
  CalendarIcon,
  TagIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';

const SmartLists = ({ onListSelect, selectedListId }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['smart', 'projects']));
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Smart lists with dynamic criteria
  const smartLists = [
    {
      id: 'today',
      name: 'Today',
      icon: CalendarIcon,
      color: 'text-primary-600 dark:text-primary-400',
      count: 8,
      criteria: { dueDate: 'today' }
    },
    {
      id: 'overdue',
      name: 'Overdue',
      icon: ExclamationTriangleIcon,
      color: 'text-error-600 dark:text-error-400',
      count: 3,
      criteria: { dueDate: 'overdue' }
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      icon: StarIcon,
      color: 'text-warning-600 dark:text-warning-400',
      count: 12,
      criteria: { priority: 'high' }
    },
    {
      id: 'upcoming',
      name: 'Upcoming',
      icon: ClockIcon,
      color: 'text-success-600 dark:text-success-400',
      count: 15,
      criteria: { dueDate: 'next-7-days' }
    }
  ];
  
  // Project folders with nested structure
  const [projectFolders, setProjectFolders] = useState([
    {
      id: 'work',
      name: 'Work Projects',
      type: 'folder',
      children: [
        { id: 'project-1', name: 'Website Redesign', type: 'project', count: 24, color: 'bg-blue-500' },
        { id: 'project-2', name: 'Mobile App', type: 'project', count: 18, color: 'bg-green-500' },
        { id: 'project-3', name: 'Marketing Campaign', type: 'project', count: 12, color: 'bg-purple-500' }
      ]
    },
    {
      id: 'personal',
      name: 'Personal',
      type: 'folder',
      children: [
        { id: 'project-4', name: 'Home Renovation', type: 'project', count: 8, color: 'bg-orange-500' },
        { id: 'project-5', name: 'Learning Goals', type: 'project', count: 6, color: 'bg-pink-500' }
      ]
    }
  ]);
  
  // Custom tags with auto-suggestions
  const [customTags, setCustomTags] = useState([
    { id: 'urgent', name: 'Urgent', color: 'bg-red-500', count: 5 },
    { id: 'client', name: 'Client Work', color: 'bg-blue-500', count: 12 },
    { id: 'review', name: 'Needs Review', color: 'bg-yellow-500', count: 7 },
    { id: 'blocked', name: 'Blocked', color: 'bg-gray-500', count: 3 }
  ]);
  
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };
  
  const handleListClick = (listId, criteria = null) => {
    onListSelect?.(listId, criteria);
  };
  
  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    
    return (
      <div key={folder.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-700 ${
            selectedListId === folder.id ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : ''
          }`}
          onClick={() => hasChildren ? toggleFolder(folder.id) : handleListClick(folder.id)}
        >
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="p-0.5 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-secondary-500" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-secondary-500" />
                )}
              </button>
            )}
            
            {folder.type === 'folder' ? (
              isExpanded ? (
                <FolderOpenIcon className="w-5 h-5 text-secondary-500" />
              ) : (
                <FolderIcon className="w-5 h-5 text-secondary-500" />
              )
            ) : (
              <div className={`w-3 h-3 rounded-full ${folder.color}`} />
            )}
            
            <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {folder.name}
            </span>
          </div>
          
          {folder.count !== undefined && (
            <span className="text-xs text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 px-2 py-1 rounded-full">
              {folder.count}
            </span>
          )}
        </motion.div>
        
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {folder.children.map(child => renderFolder(child, level + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  return (
    <div className="w-64 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Organization
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="p-1"
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Smart Lists */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Smart Lists
            </h3>
            <button
              onClick={() => toggleFolder('smart')}
              className="p-0.5 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded"
            >
              {expandedFolders.has('smart') ? (
                <ChevronDownIcon className="w-4 h-4 text-secondary-500" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-secondary-500" />
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedFolders.has('smart') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                {smartLists.map((list, index) => {
                  const Icon = list.icon;
                  return (
                    <motion.button
                      key={list.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleListClick(list.id, list.criteria)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-700 ${
                        selectedListId === list.id ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${list.color}`} />
                        <span className="text-sm text-secondary-900 dark:text-secondary-100">
                          {list.name}
                        </span>
                      </div>
                      <span className="text-xs text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 px-2 py-1 rounded-full">
                        {list.count}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Projects */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Projects
            </h3>
            <button
              onClick={() => toggleFolder('projects')}
              className="p-0.5 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded"
            >
              {expandedFolders.has('projects') ? (
                <ChevronDownIcon className="w-4 h-4 text-secondary-500" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-secondary-500" />
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedFolders.has('projects') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                {projectFolders.map(folder => renderFolder(folder))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Tags
            </h3>
            <button
              onClick={() => toggleFolder('tags')}
              className="p-0.5 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded"
            >
              {expandedFolders.has('tags') ? (
                <ChevronDownIcon className="w-4 h-4 text-secondary-500" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-secondary-500" />
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedFolders.has('tags') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                {customTags.map((tag, index) => (
                  <motion.button
                    key={tag.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleListClick(`tag:${tag.id}`, { tag: tag.id })}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-700 ${
                      selectedListId === `tag:${tag.id}` ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                      <span className="text-sm text-secondary-900 dark:text-secondary-100">
                        {tag.name}
                      </span>
                    </div>
                    <span className="text-xs text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 px-2 py-1 rounded-full">
                      {tag.count}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SmartLists;