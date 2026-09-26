import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card } from '../ui';
import { 
  XMarkIcon,
  CalendarIcon,
  FlagIcon,
  TagIcon,
  PlusIcon,
  PaperClipIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const RichTaskEditor = ({ 
  task = null, 
  isOpen, 
  onClose, 
  onSubmit,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    content: task?.content || '',
    priority: task?.priority || 'medium',
    due: task?.due ? new Date(task.due).toISOString().slice(0, 16) : '',
    tags: task?.tags || [],
    category: task?.category || 'general',
    estimatedTime: task?.estimatedTime || 0,
    assignee: task?.assignee || null,
    subtasks: task?.subtasks || [],
    attachments: task?.attachments || [],
  });
  
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const fileInputRef = useRef(null);
  
  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-success-500', textColor: 'text-success-600' },
    { value: 'medium', label: 'Medium', color: 'bg-warning-500', textColor: 'text-warning-600' },
    { value: 'high', label: 'High', color: 'bg-error-500', textColor: 'text-error-600' },
  ];
  
  const categories = [
    'general', 'work', 'personal', 'health', 'learning', 'finance', 'travel', 'shopping'
  ];
  
  const tabs = [
    { id: 'details', label: 'Details', icon: DocumentTextIcon },
    { id: 'subtasks', label: 'Subtasks', icon: ListBulletIcon },
    { id: 'attachments', label: 'Files', icon: PaperClipIcon },
    { id: 'time', label: 'Time', icon: ClockIcon },
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsSubmitting(true);
    try {
      const taskData = {
        ...formData,
        due: formData.due ? new Date(formData.due).toISOString() : null,
        estimatedTime: parseInt(formData.estimatedTime) || 0,
      };
      
      await onSubmit(taskData);
      handleClose();
    } catch (error) {
      //console.error('Error saving task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (!task) {
      setFormData({
        title: '',
        description: '',
        content: '',
        priority: 'medium',
        due: '',
        tags: [],
        category: 'general',
        estimatedTime: 0,
        assignee: null,
        subtasks: [],
        attachments: [],
      });
    }
    setNewTag('');
    setNewSubtask('');
    setActiveTab('details');
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
  
  const addSubtask = () => {
    if (newSubtask.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, {
          id: Date.now(),
          title: newSubtask.trim(),
          completed: false,
          createdAt: new Date().toISOString()
        }]
      }));
      setNewSubtask('');
    }
  };
  
  const removeSubtask = (subtaskId) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
    }));
  };
  
  const toggleSubtask = (subtaskId) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }));
  };
  
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real app, you'd upload these files to a server
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      filename: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Temporary URL for preview
      uploadedAt: new Date().toISOString()
    }));
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };
  
  const removeAttachment = (attachmentId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }));
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <Card padding="none" className="overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                    {mode === 'create' ? 'Create New Task' : 'Edit Task'}
                  </h3>
                  <button
                    onClick={handleClose}
                    className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-secondary-200 dark:border-secondary-700">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-6 py-3 text-sm font-medium transition-colors relative ${
                          activeTab === tab.id
                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                            : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-140px)]">
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                      <div className="space-y-6">
                        {/* Title */}
                        <Input
                          label="Task Title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="What needs to be done?"
                          required
                          className="text-lg"
                        />
                        
                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Description
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Add a description..."
                            rows={3}
                            className="block w-full px-3 py-2 text-sm bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-sm placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                          />
                        </div>
                        
                        {/* Rich Content */}
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Detailed Notes
                          </label>
                          <div className="border border-secondary-300 dark:border-secondary-600 rounded-lg overflow-hidden">
                            {/* Toolbar */}
                            <div className="flex items-center space-x-1 p-2 border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800">
                              <button type="button" className="p-1 text-secondary-600 hover:text-secondary-900 dark:hover:text-secondary-100 rounded">
                                <BoldIcon className="w-4 h-4" />
                              </button>
                              <button type="button" className="p-1 text-secondary-600 hover:text-secondary-900 dark:hover:text-secondary-100 rounded">
                                <ItalicIcon className="w-4 h-4" />
                              </button>
                              <button type="button" className="p-1 text-secondary-600 hover:text-secondary-900 dark:hover:text-secondary-100 rounded">
                                <ListBulletIcon className="w-4 h-4" />
                              </button>
                              <button type="button" className="p-1 text-secondary-600 hover:text-secondary-900 dark:hover:text-secondary-100 rounded">
                                <LinkIcon className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              value={formData.content}
                              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                              placeholder="Add detailed notes, links, or formatted content..."
                              rows={6}
                              className="block w-full px-3 py-2 text-sm bg-white dark:bg-secondary-800 border-0 placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                        
                        {/* Priority, Category, Due Date Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Priority */}
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                              Priority
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {priorities.map((priority) => (
                                <button
                                  key={priority.value}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                                  className={`p-3 rounded-lg border text-xs font-medium transition-all duration-200 ${
                                    formData.priority === priority.value
                                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                      : 'border-secondary-300 dark:border-secondary-600 text-secondary-600 dark:text-secondary-400 hover:border-secondary-400'
                                  }`}
                                >
                                  <div className={`w-3 h-3 rounded-full ${priority.color} mx-auto mb-1`} />
                                  {priority.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Category */}
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                              Category
                            </label>
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                              className="block w-full px-3 py-2 text-sm bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                            >
                              {categories.map((category) => (
                                <option key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                              ))}
                            </select>
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
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Tags
                          </label>
                          <div className="flex space-x-2 mb-3">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
                          
                          {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.tags.map((tag, index) => (
                                <motion.span
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                  </button>
                                </motion.span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Subtasks Tab */}
                    {activeTab === 'subtasks' && (
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <Input
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                            placeholder="Add a subtask..."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={addSubtask}
                            disabled={!newSubtask.trim()}
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {formData.subtasks.map((subtask) => (
                            <motion.div
                              key={subtask.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                            >
                              <input
                                type="checkbox"
                                checked={subtask.completed}
                                onChange={() => toggleSubtask(subtask.id)}
                                className="w-4 h-4 text-primary-600 bg-white dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 rounded focus:ring-primary-500"
                              />
                              <span className={`flex-1 text-sm ${
                                subtask.completed 
                                  ? 'line-through text-secondary-500 dark:text-secondary-400' 
                                  : 'text-secondary-900 dark:text-secondary-100'
                              }`}>
                                {subtask.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeSubtask(subtask.id)}
                                className="text-secondary-400 hover:text-error-600 dark:hover:text-error-400"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                        
                        {formData.subtasks.length === 0 && (
                          <div className="text-center py-8">
                            <ListBulletIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                            <p className="text-sm text-secondary-500 dark:text-secondary-400">
                              No subtasks added yet
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Attachments Tab */}
                    {activeTab === 'attachments' && (
                      <div className="space-y-4">
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            leftIcon={<PaperClipIcon className="w-4 h-4" />}
                          >
                            Attach Files
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {formData.attachments.map((attachment) => (
                            <motion.div
                              key={attachment.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                            >
                              <PaperClipIcon className="w-5 h-5 text-secondary-400" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                                  {attachment.filename}
                                </p>
                                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(attachment.id)}
                                className="text-secondary-400 hover:text-error-600 dark:hover:text-error-400"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                        
                        {formData.attachments.length === 0 && (
                          <div className="text-center py-8">
                            <PaperClipIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                            <p className="text-sm text-secondary-500 dark:text-secondary-400">
                              No files attached
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Time Tab */}
                    {activeTab === 'time' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Estimated Time (minutes)
                          </label>
                          <Input
                            type="number"
                            value={formData.estimatedTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                            placeholder="0"
                            min="0"
                            leftIcon={<ClockIcon className="w-4 h-4" />}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Assignee
                          </label>
                          <div className="flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                            <UserIcon className="w-5 h-5 text-secondary-400" />
                            <span className="text-sm text-secondary-600 dark:text-secondary-400">
                              Assign to team member (Coming soon)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-end space-x-3 p-6 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSubmitting}
                      disabled={!formData.title.trim()}
                    >
                      {mode === 'create' ? 'Create Task' : 'Save Changes'}
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

export default RichTaskEditor;