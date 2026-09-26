import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentDuplicateIcon,
  PlusIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  CodeBracketIcon,
  PresentationChartLineIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button, Input } from '../ui';

const TaskTemplates = ({ onTemplateSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  
  const templateCategories = [
    { id: 'all', name: 'All Templates', icon: DocumentDuplicateIcon },
    { id: 'development', name: 'Development', icon: CodeBracketIcon },
    { id: 'meeting', name: 'Meetings', icon: ChatBubbleLeftRightIcon },
    { id: 'project', name: 'Project Management', icon: PresentationChartLineIcon },
    { id: 'personal', name: 'Personal', icon: StarIcon }
  ];
  
  const taskTemplates = [
    {
      id: 'bug-fix',
      name: 'Bug Fix',
      description: 'Template for tracking and fixing bugs',
      category: 'development',
      icon: CodeBracketIcon,
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      estimatedTime: '2-4 hours',
      fields: {
        title: 'Fix: [Bug Description]',
        description: `## Bug Description\n[Describe the bug]\n\n## Steps to Reproduce\n1. \n2. \n3. \n\n## Expected Behavior\n[What should happen]\n\n## Actual Behavior\n[What actually happens]\n\n## Environment\n- Browser: \n- OS: \n- Version: \n\n## Solution\n[How to fix it]`,
        priority: 'high',
        tags: ['bug', 'development'],
        customFields: [
          { name: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
          { name: 'Browser', type: 'text', placeholder: 'Chrome, Firefox, Safari...' },
          { name: 'Affected Users', type: 'number', placeholder: 'Number of users affected' }
        ]
      }
    },
    {
      id: 'feature-development',
      name: 'Feature Development',
      description: 'Template for developing new features',
      category: 'development',
      icon: CodeBracketIcon,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      estimatedTime: '1-2 weeks',
      fields: {
        title: 'Feature: [Feature Name]',
        description: `## Feature Overview\n[Brief description of the feature]\n\n## Requirements\n- [ ] Requirement 1\n- [ ] Requirement 2\n- [ ] Requirement 3\n\n## Technical Approach\n[How will this be implemented]\n\n## Acceptance Criteria\n- [ ] Criteria 1\n- [ ] Criteria 2\n- [ ] Criteria 3\n\n## Testing Plan\n[How will this be tested]`,
        priority: 'medium',
        tags: ['feature', 'development'],
        customFields: [
          { name: 'Epic', type: 'text', placeholder: 'Related epic or project' },
          { name: 'Story Points', type: 'select', options: ['1', '2', '3', '5', '8', '13'] },
          { name: 'Dependencies', type: 'text', placeholder: 'Other tasks or features needed' }
        ]
      }
    },
    {
      id: 'team-meeting',
      name: 'Team Meeting',
      description: 'Template for organizing team meetings',
      category: 'meeting',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      estimatedTime: '1 hour',
      fields: {
        title: 'Team Meeting - [Date]',
        description: `## Meeting Details\n**Date:** [Date]\n**Time:** [Time]\n**Duration:** [Duration]\n**Location/Link:** [Location or video link]\n\n## Agenda\n1. \n2. \n3. \n\n## Attendees\n- [ ] Team Member 1\n- [ ] Team Member 2\n- [ ] Team Member 3\n\n## Action Items\n- [ ] Action item 1\n- [ ] Action item 2\n\n## Notes\n[Meeting notes will go here]`,
        priority: 'medium',
        tags: ['meeting', 'team'],
        customFields: [
          { name: 'Meeting Type', type: 'select', options: ['Standup', 'Planning', 'Retrospective', 'Review'] },
          { name: 'Recurring', type: 'select', options: ['No', 'Daily', 'Weekly', 'Bi-weekly', 'Monthly'] },
          { name: 'Required Attendees', type: 'number', placeholder: 'Number of required attendees' }
        ]
      }
    },
    {
      id: 'project-planning',
      name: 'Project Planning',
      description: 'Template for planning new projects',
      category: 'project',
      icon: PresentationChartLineIcon,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      estimatedTime: '1-2 days',
      fields: {
        title: 'Project Planning: [Project Name]',
        description: `## Project Overview\n[Brief description of the project]\n\n## Objectives\n- [ ] Objective 1\n- [ ] Objective 2\n- [ ] Objective 3\n\n## Scope\n### In Scope\n- \n- \n\n### Out of Scope\n- \n- \n\n## Timeline\n**Start Date:** [Date]\n**End Date:** [Date]\n**Key Milestones:**\n- [ ] Milestone 1 - [Date]\n- [ ] Milestone 2 - [Date]\n\n## Resources\n**Team Members:**\n- \n- \n\n**Budget:** [Budget if applicable]\n\n## Risks\n- Risk 1: [Mitigation strategy]\n- Risk 2: [Mitigation strategy]`,
        priority: 'high',
        tags: ['project', 'planning'],
        customFields: [
          { name: 'Project Type', type: 'select', options: ['Internal', 'Client', 'Research', 'Maintenance'] },
          { name: 'Budget', type: 'number', placeholder: 'Project budget' },
          { name: 'Stakeholders', type: 'text', placeholder: 'Key stakeholders' }
        ]
      }
    },
    {
      id: 'personal-goal',
      name: 'Personal Goal',
      description: 'Template for tracking personal goals',
      category: 'personal',
      icon: StarIcon,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      estimatedTime: 'Varies',
      fields: {
        title: 'Goal: [Goal Description]',
        description: `## Goal Description\n[What do you want to achieve?]\n\n## Why This Goal?\n[Motivation and reasoning]\n\n## Success Criteria\n- [ ] Criteria 1\n- [ ] Criteria 2\n- [ ] Criteria 3\n\n## Action Steps\n- [ ] Step 1\n- [ ] Step 2\n- [ ] Step 3\n\n## Timeline\n**Target Date:** [Date]\n**Check-in Dates:**\n- [ ] Check-in 1 - [Date]\n- [ ] Check-in 2 - [Date]\n\n## Resources Needed\n- \n- \n\n## Potential Obstacles\n- Obstacle 1: [How to overcome]\n- Obstacle 2: [How to overcome]`,
        priority: 'medium',
        tags: ['personal', 'goal'],
        customFields: [
          { name: 'Goal Category', type: 'select', options: ['Health', 'Career', 'Learning', 'Financial', 'Relationship'] },
          { name: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard', 'Very Hard'] },
          { name: 'Accountability Partner', type: 'text', placeholder: 'Who will help keep you accountable?' }
        ]
      }
    }
  ];
  
  const filteredTemplates = taskTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const handleTemplateSelect = (template) => {
    onTemplateSelect?.(template);
    onClose?.();
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
            <div>
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                Task Templates
              </h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                Choose a template to quickly create structured tasks
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search and Categories */}
          <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {templateCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                          : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Templates Grid */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template, index) => {
                const Icon = template.icon;
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-secondary-200 dark:border-secondary-700 rounded-xl p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer group"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="w-3 h-3 text-secondary-400" />
                            <span className="text-xs text-secondary-500 dark:text-secondary-400">
                              {template.estimatedTime}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {template.fields.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {template.fields.tags.length > 2 && (
                              <span className="text-xs text-secondary-500 dark:text-secondary-400">
                                +{template.fields.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {filteredTemplates.length === 0 && (
              <div className="text-center py-8">
                <DocumentDuplicateIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                <p className="text-secondary-500 dark:text-secondary-400">
                  No templates found matching your criteria
                </p>
                <p className="text-sm text-secondary-400 dark:text-secondary-500 mt-1">
                  Try adjusting your search or category filter
                </p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800">
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowCreateTemplate(true)}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Template
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaskTemplates;