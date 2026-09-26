import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card } from '../ui';
import { 
  XMarkIcon,
  CalendarIcon,
  FlagIcon,
  TagIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const QuickTaskModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due: '',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-success-500' },
    { value: 'medium', label: 'Medium', color: 'bg-warning-500' },
    { value: 'high', label: 'High', color: 'bg-error-500' },
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      //console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due: '',
      tags: [],
    });
    setNewTag('');
    onClose();
  };
  
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.name === 'newTag') {
      e.preventDefault();
      addTag();
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md"
            >
              <Card padding="none" className="overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    Quick Task
                  </h3>
                  <button
                    onClick={handleClose}
                    className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Title */}
                  <Input
                    label="Task Title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    required
                    autoFocus
                  />
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add more details..."
                      rows={3}
                      className="block w-full px-3 py-2 text-sm bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-sm placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                    />
                  </div>
                  
                  {/* Priority and Due Date Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                        Priority
                      </label>
                      <div className="flex space-x-2">
                        {priorities.map((priority) => (
                          <button
                            key={priority.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                            className={`flex-1 p-2 rounded-lg border text-xs font-medium transition-all duration-200 ${
                              formData.priority === priority.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'border-secondary-300 dark:border-secondary-600 text-secondary-600 dark:text-secondary-400 hover:border-secondary-400'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${priority.color} mx-auto mb-1`} />
                            {priority.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Due Date */}
                    <Input
                      label="Due Date"
                      type="datetime-local"
                      value={formData.due}
                      onChange={(e) => setFormData(prev => ({ ...prev, due: e.target.value }))}
                      leftIcon={<CalendarIcon className="w-4 h-4" />}
                    />
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      Tags
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        name="newTag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add a tag..."
                        leftIcon={<TagIcon className="w-4 h-4" />}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTag}
                        disabled={!newTag.trim()}
                      >
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Tag List */}
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <motion.span
                            key={`tag-${tag}-${index}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSubmitting}
                      disabled={!formData.title.trim()}
                      className="flex-1"
                    >
                      Create Task
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickTaskModal;