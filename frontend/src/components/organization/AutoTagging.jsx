import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TagIcon,
  SparklesIcon,
  XMarkIcon,
  PlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';

const AutoTagging = ({ taskContent, existingTags = [], onTagsChange }) => {
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedTags, setSelectedTags] = useState(new Set(existingTags));
  
  // Predefined tag categories with keywords
  const tagCategories = {
    priority: {
      urgent: ['urgent', 'asap', 'emergency', 'critical', 'immediate'],
      important: ['important', 'priority', 'key', 'essential', 'vital'],
      low: ['low', 'minor', 'optional', 'nice to have', 'when time permits']
    },
    type: {
      meeting: ['meeting', 'call', 'conference', 'discussion', 'standup'],
      research: ['research', 'investigate', 'analyze', 'study', 'explore'],
      development: ['code', 'develop', 'build', 'implement', 'program'],
      design: ['design', 'mockup', 'wireframe', 'prototype', 'ui', 'ux'],
      review: ['review', 'feedback', 'approve', 'check', 'validate'],
      documentation: ['document', 'write', 'spec', 'readme', 'guide']
    },
    context: {
      client: ['client', 'customer', 'external', 'stakeholder'],
      internal: ['internal', 'team', 'company', 'organization'],
      personal: ['personal', 'self', 'individual', 'private'],
      collaboration: ['collaborate', 'team', 'group', 'together', 'shared']
    },
    status: {
      blocked: ['blocked', 'waiting', 'dependency', 'stuck', 'pending'],
      'in-progress': ['working', 'active', 'current', 'ongoing'],
      'needs-review': ['review', 'feedback', 'approval', 'check']
    }
  };
  
  // Color mapping for different tag types
  const tagColors = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    important: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    meeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    research: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    development: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    design: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
    review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    documentation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
    client: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300',
    internal: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300',
    personal: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
    collaboration: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-300',
    blocked: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    'needs-review': 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    default: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300'
  };
  
  // Analyze content and suggest tags
  useEffect(() => {
    if (taskContent) {
      const content = taskContent.toLowerCase();
      const suggestions = [];
      
      // Check each category for keyword matches
      Object.entries(tagCategories).forEach(([category, tags]) => {
        Object.entries(tags).forEach(([tagName, keywords]) => {
          const hasKeyword = keywords.some(keyword => 
            content.includes(keyword.toLowerCase())
          );
          
          if (hasKeyword && !existingTags.includes(tagName)) {
            suggestions.push({
              name: tagName,
              category,
              confidence: calculateConfidence(content, keywords),
              reason: `Contains "${keywords.find(k => content.includes(k.toLowerCase()))}"`
            });
          }
        });
      });
      
      // Sort by confidence and take top suggestions
      const topSuggestions = suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
      
      setSuggestedTags(topSuggestions);
    }
  }, [taskContent, existingTags]);
  
  const calculateConfidence = (content, keywords) => {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        score += matches.length * (keyword.length / 10); // Longer keywords get higher weight
      }
    });
    return Math.min(score, 1); // Cap at 1.0
  };
  
  const handleTagToggle = (tagName) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tagName)) {
      newSelectedTags.delete(tagName);
    } else {
      newSelectedTags.add(tagName);
    }
    setSelectedTags(newSelectedTags);
    onTagsChange?.(Array.from(newSelectedTags));
  };
  
  const handleCustomTagAdd = () => {
    if (customTag.trim() && !selectedTags.has(customTag.trim())) {
      const newSelectedTags = new Set(selectedTags);
      newSelectedTags.add(customTag.trim());
      setSelectedTags(newSelectedTags);
      onTagsChange?.(Array.from(newSelectedTags));
      setCustomTag('');
      setShowCustomInput(false);
    }
  };
  
  const getTagColor = (tagName) => {
    return tagColors[tagName] || tagColors.default;
  };
  
  return (
    <div className="space-y-4">
      {/* AI Suggestions */}
      {suggestedTags.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <SparklesIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              AI Suggested Tags
            </h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((suggestion, index) => (
              <motion.button
                key={suggestion.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleTagToggle(suggestion.name)}
                className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border-2 ${
                  selectedTags.has(suggestion.name)
                    ? 'border-primary-300 dark:border-primary-600 ' + getTagColor(suggestion.name)
                    : 'border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
                title={suggestion.reason}
              >
                <TagIcon className="w-3 h-3" />
                <span>{suggestion.name}</span>
                {selectedTags.has(suggestion.name) && (
                  <CheckIcon className="w-3 h-3" />
                )}
                <div className="w-2 h-2 rounded-full bg-current opacity-60" 
                     style={{ opacity: suggestion.confidence }} />
              </motion.button>
            ))}
          </div>
        </div>
      )}
      
      {/* Selected Tags */}
      {selectedTags.size > 0 && (
        <div>
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Selected Tags
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedTags).map((tagName) => (
              <motion.div
                key={tagName}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${getTagColor(tagName)}`}
              >
                <TagIcon className="w-3 h-3" />
                <span>{tagName}</span>
                <button
                  onClick={() => handleTagToggle(tagName)}
                  className="hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Custom Tag Input */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Custom Tags
          </h4>
          {!showCustomInput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomInput(true)}
              className="text-xs"
            >
              <PlusIcon className="w-3 h-3 mr-1" />
              Add Tag
            </Button>
          )}
        </div>
        
        <AnimatePresence>
          {showCustomInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomTagAdd();
                  } else if (e.key === 'Escape') {
                    setShowCustomInput(false);
                    setCustomTag('');
                  }
                }}
                placeholder="Enter custom tag..."
                className="flex-1 px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                autoFocus
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCustomTagAdd}
                disabled={!customTag.trim()}
              >
                <CheckIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomTag('');
                }}
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Tag Statistics */}
      {selectedTags.size > 0 && (
        <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <div className="text-xs text-secondary-500 dark:text-secondary-400">
            {selectedTags.size} tag{selectedTags.size !== 1 ? 's' : ''} selected
            {suggestedTags.length > 0 && (
              <span className="ml-2">
                • {suggestedTags.filter(s => selectedTags.has(s.name)).length} AI suggested
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoTagging;