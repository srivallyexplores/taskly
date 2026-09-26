import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useCalendar } from '../../context/CalendarContext';
import { dateUtils } from '../../utils/dateUtils';
import DateNavigator from '../calendar/DateNavigator';
import LoadingSpinner from '../common/LoadingSpinner';

const EnhancedTaskForm = ({
  task = null,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  className = '',
  calendarContext = false, // Whether this form is opened from calendar
  preselectedDate = null,
  preselectedTime = null
}) => {
  const isEditing = !!task;
  const { currentDate, selectedDate } = useCalendar();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due: '',
    time: '',
    priority: 'medium',
    tags: [],
    labels: [],
    project: null,
    assignee: null,
    estimatedTime: 0,
    recurring: {
      enabled: false,
      pattern: 'weekly',
      interval: 1,
      endDate: null
    }
  });
  
  const [tagInput, setTagInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (task) {
      // Editing existing task
      const dueDate = task.due ? format(new Date(task.due), 'yyyy-MM-dd') : '';
      const dueTime = task.due ? format(new Date(task.due), 'HH:mm') : '';
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        due: dueDate,
        time: dueTime,
        priority: task.priority || 'medium',
        tags: task.tags || [],
        labels: task.labels || [],
        project: task.project || null,
        assignee: task.assignee || null,
        estimatedTime: task.estimatedTime || 0,
        recurring: task.recurring || {
          enabled: false,
          pattern: 'weekly',
          interval: 1,
          endDate: null
        }
      });
    } else {
      // Creating new task
      let defaultDate = '';
      let defaultTime = '';

      if (preselectedDate) {
        defaultDate = dateUtils.formatCalendarDate(preselectedDate);
      } else if (calendarContext && selectedDate) {
        defaultDate = dateUtils.formatCalendarDate(selectedDate);
      } else {
        defaultDate = format(new Date(), 'yyyy-MM-dd');
      }

      if (preselectedTime) {
        defaultTime = format(preselectedTime, 'HH:mm');
      }

      setFormData(prev => ({
        ...prev,
        due: defaultDate,
        time: defaultTime
      }));
    }
  }, [task, preselectedDate, preselectedTime, calendarContext, selectedDate]);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.due) {
      newErrors.due = 'Due date is required';
    } else {
      const dueDate = new Date(formData.due);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.due = 'Due date cannot be in the past';
      }
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    if (formData.recurring.enabled && formData.recurring.endDate) {
      const endDate = new Date(formData.recurring.endDate);
      const dueDate = new Date(formData.due);
      
      if (endDate <= dueDate) {
        newErrors.recurringEndDate = 'End date must be after due date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., recurring.pattern)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // Handle date selection from calendar
  const handleDateSelect = useCallback((date) => {
    setFormData(prev => ({
      ...prev,
      due: dateUtils.formatCalendarDate(date)
    }));
    setShowDatePicker(false);
  }, []);

  // Handle quick date selections
  const handleQuickDate = useCallback((days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFormData(prev => ({
      ...prev,
      due: dateUtils.formatCalendarDate(date)
    }));
  }, []);

  // Handle tag management
  const handleTagInputChange = useCallback((e) => {
    setTagInput(e.target.value);
  }, []);

  const handleTagInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.slice(0, -1)
      }));
    }
  }, [tagInput, formData.tags]);

  const removeTag = useCallback((tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  // Handle label management
  const handleLabelInputChange = useCallback((e) => {
    setLabelInput(e.target.value);
  }, []);

  const handleLabelInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const label = labelInput.trim();
      if (label && !formData.labels.includes(label)) {
        setFormData(prev => ({
          ...prev,
          labels: [...prev.labels, label]
        }));
      }
      setLabelInput('');
    } else if (e.key === 'Backspace' && !labelInput && formData.labels.length > 0) {
      setFormData(prev => ({
        ...prev,
        labels: prev.labels.slice(0, -1)
      }));
    }
  }, [labelInput, formData.labels]);

  const removeLabel = useCallback((labelToRemove) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Combine date and time
    let dueDateTime = formData.due;
    if (formData.time) {
      const dateTime = new Date(formData.due);
      const [hours, minutes] = formData.time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      dueDateTime = dateTime.toISOString();
    } else {
      dueDateTime = new Date(formData.due).toISOString();
    }

    const submitData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      due: dueDateTime
    };

    try {
      await onSubmit(submitData);
    } catch (error) {
      //console.error('Form submission error:', error);
    }
  }, [formData, validateForm, onSubmit]);

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-secondary-200 dark:border-secondary-700 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          {calendarContext && (
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
              {preselectedDate 
                ? `Scheduled for ${dateUtils.formatDisplayDate(preselectedDate)}`
                : 'Creating from calendar'
              }
            </p>
          )}
        </div>
        <button
          type="button"
          className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
          onClick={onCancel}
          aria-label="Close form"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.title 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-secondary-300 dark:border-secondary-600'
            }`}
            placeholder="Enter task title..."
            maxLength={200}
            disabled={loading}
            autoFocus
          />
          {errors.title && <span className="text-red-600 dark:text-red-400 text-sm mt-1 block">{errors.title}</span>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Enter task description..."
            rows={3}
            maxLength={1000}
            disabled={loading}
          />
          <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 text-right">
            {formData.description.length}/1000
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Due Date *
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                name="due"
                value={formData.due}
                onChange={handleInputChange}
                className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.due 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-secondary-300 dark:border-secondary-600'
                }`}
                min={format(new Date(), 'yyyy-MM-dd')}
                disabled={loading}
              />
              <DateNavigator
                onDatePickerToggle={setShowDatePicker}
                className="flex-shrink-0"
              />
            </div>
            
            {/* Quick date buttons */}
            <div className="flex gap-1 mt-2">
              <button
                type="button"
                onClick={() => handleQuickDate(0)}
                className="px-2 py-1 text-xs bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded transition-colors"
                disabled={loading}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(1)}
                className="px-2 py-1 text-xs bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded transition-colors"
                disabled={loading}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(7)}
                className="px-2 py-1 text-xs bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded transition-colors"
                disabled={loading}
              >
                Next Week
              </button>
            </div>
            
            {errors.due && <span className="text-red-600 dark:text-red-400 text-sm mt-1 block">{errors.due}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Time
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Priority and Estimated Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Priority *
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.priority 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-secondary-300 dark:border-secondary-600'
              }`}
              disabled={loading}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            {errors.priority && <span className="text-red-600 dark:text-red-400 text-sm mt-1 block">{errors.priority}</span>}
          </div>

          <div>
            <label htmlFor="estimatedTime" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              id="estimatedTime"
              name="estimatedTime"
              value={formData.estimatedTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="0"
              step="15"
              placeholder="0"
              disabled={loading}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Tags
          </label>
          <div className="border border-secondary-300 dark:border-secondary-600 rounded-lg p-2 bg-white dark:bg-secondary-700">
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <motion.span 
                  key={index} 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm rounded-full"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </motion.span>
              ))}
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 min-w-0 border-none outline-none bg-transparent text-secondary-900 dark:text-secondary-100 placeholder-secondary-500"
                placeholder="Add tags..."
                disabled={loading}
              />
            </div>
          </div>
          <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
            Press Enter or comma to add tags
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              className="ml-1"
            >
              ▼
            </motion.div>
          </button>
        </div>

        {/* Advanced Options */}
        <motion.div
          initial={false}
          animate={{ height: showAdvanced ? 'auto' : 0, opacity: showAdvanced ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="space-y-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
            {/* Labels */}
            <div>
              <label htmlFor="labels" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Labels
              </label>
              <div className="border border-secondary-300 dark:border-secondary-600 rounded-lg p-2 bg-white dark:bg-secondary-700">
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.labels.map((label, index) => (
                    <motion.span 
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center px-3 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-sm rounded-full"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => removeLabel(label)}
                        className="ml-2 text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200"
                        aria-label={`Remove label ${label}`}
                      >
                        ×
                      </button>
                    </motion.span>
                  ))}
                  <input
                    type="text"
                    id="labels"
                    value={labelInput}
                    onChange={handleLabelInputChange}
                    onKeyDown={handleLabelInputKeyDown}
                    className="flex-1 min-w-0 border-none outline-none bg-transparent text-secondary-900 dark:text-secondary-100 placeholder-secondary-500"
                    placeholder="Add labels..."
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Recurring Task */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="recurring-enabled"
                  name="recurring.enabled"
                  checked={formData.recurring.enabled}
                  onChange={handleInputChange}
                  className="rounded border-secondary-300 dark:border-secondary-600"
                  disabled={loading}
                />
                <label htmlFor="recurring-enabled" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Make this a recurring task
                </label>
              </div>

              {formData.recurring.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-6">
                  <div>
                    <label className="block text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                      Repeat
                    </label>
                    <select
                      name="recurring.pattern"
                      value={formData.recurring.pattern}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                      disabled={loading}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                      Every
                    </label>
                    <input
                      type="number"
                      name="recurring.interval"
                      value={formData.recurring.interval}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                      min="1"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="recurring.endDate"
                      value={formData.recurring.endDate || ''}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                      min={formData.due}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
              {errors.recurringEndDate && (
                <span className="text-red-600 dark:text-red-400 text-xs mt-1 block ml-6">
                  {errors.recurringEndDate}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-secondary-200 dark:border-secondary-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <span>{isEditing ? 'Update Task' : 'Create Task'}</span>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedTaskForm;