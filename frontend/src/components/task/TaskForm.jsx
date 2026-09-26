import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { UserIcon, UsersIcon, FolderIcon } from '@heroicons/react/24/outline'
import { useTeam } from '../../context/TeamContext'
import { useProject } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import Avatar from '../common/Avatar'
import Badge from '../common/Badge'

const TaskForm = ({
  task = null,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  className = '',
  teamId = null,
  projectId = null,
  showAssignment = true,
  showProjectSelection = true
}) => {
  const { user } = useAuth()
  const { teams, currentTeam, fetchTeams } = useTeam()
  const { projects, currentProject, fetchProjects } = useProject()
  
  const isEditing = !!task
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due: '',
    priority: 'medium',
    tags: [],
    labels: [],
    assignee: '',
    projectId: projectId || '',
    teamId: teamId || ''
  })
  
  const [tagInput, setTagInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [errors, setErrors] = useState({})

  // Fetch teams and projects on mount
  useEffect(() => {
    if (showAssignment || showProjectSelection) {
      fetchTeams()
      fetchProjects()
    }
  }, [showAssignment, showProjectSelection, fetchTeams, fetchProjects])

  // Initialize form data when task prop changes
  useEffect(() => {
    if (task) {
      const dueDate = task.due ? format(new Date(task.due), 'yyyy-MM-dd') : ''
      setFormData({
        title: task.title || '',
        description: task.description || '',
        due: dueDate,
        priority: task.priority || 'medium',
        tags: task.tags || [],
        labels: task.labels || [],
        assignee: task.assignee?._id || task.assignee || '',
        projectId: task.project?._id || task.projectId || projectId || '',
        teamId: task.team?._id || task.teamId || teamId || ''
      })
    } else {
      // Set default due date to today for new tasks
      const today = format(new Date(), 'yyyy-MM-dd')
      setFormData(prev => ({
        ...prev,
        due: today,
        projectId: projectId || '',
        teamId: teamId || ''
      }))
    }
  }, [task, projectId, teamId])

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.due) {
      newErrors.due = 'Due date is required'
    } else {
      const dueDate = new Date(formData.due)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        newErrors.due = 'Due date cannot be in the past'
      }
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }, [errors])

  // Handle tag input
  const handleTagInputChange = useCallback((e) => {
    setTagInput(e.target.value)
  }, [])

  const handleTagInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim()
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }))
      }
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.slice(0, -1)
      }))
    }
  }, [tagInput, formData.tags])

  const removeTag = useCallback((tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // Handle label input
  const handleLabelInputChange = useCallback((e) => {
    setLabelInput(e.target.value)
  }, [])

  const handleLabelInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const label = labelInput.trim()
      if (label && !formData.labels.includes(label)) {
        setFormData(prev => ({
          ...prev,
          labels: [...prev.labels, label]
        }))
      }
      setLabelInput('')
    } else if (e.key === 'Backspace' && !labelInput && formData.labels.length > 0) {
      setFormData(prev => ({
        ...prev,
        labels: prev.labels.slice(0, -1)
      }))
    }
  }, [labelInput, formData.labels])

  const removeLabel = useCallback((labelToRemove) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }))
  }, [])

  // Get available team members for assignment
  const availableMembers = React.useMemo(() => {

    
    let members = []
    
    // If a specific project is selected, use project members
    if (formData.projectId) {
      console.log('  [TaskForm] Project selected, finding project...');
      const project = projects.find(p => p._id === formData.projectId)
      console.log('  [TaskForm] Found project:', project);
      console.log('  [TaskForm] Project members:', project?.members);
      
      if (project?.members) {
        members = project.members.map(m => m.user)
        console.log('  [TaskForm] Mapped project members:', members);
      } else {
        console.log('[TaskForm] Project has no members or members not populated');
      }
    }
    // If a team is selected but no project, use team members
    else if (formData.teamId) {
      //console.log('  [TaskForm] Team selected (no project), finding team...');
      const team = teams.find(t => t._id === formData.teamId)
      
      
      if (team?.members) {
        members = team.members.map(m => m.user)
        console.log('  [TaskForm] Mapped team members:', members);
      } else {
        console.log('❌ [TaskForm] Team has no members or members not populated');
      }
    } else {
      console.log('  [TaskForm] No team or project selected');
    }
    
    // Always include current user as an option
    if (user && !members.find(m => m._id === user._id)) {
      console.log('  [TaskForm] Adding current user to members list');
      members.unshift(user)
    } else if (user) {
      console.log('  [TaskForm] Current user already in members list');
    } else {
      console.log('❌ [TaskForm] No current user available');
    }
    
    
    //console.log('  [TaskForm] ========== CALCULATION COMPLETE ==========');
    return members
  }, [formData.projectId, formData.teamId, projects, teams, user])

  // Get available projects (filtered by team if team is selected)
  const availableProjects = React.useMemo(() => {
    if (formData.teamId) {
      return projects.filter(p => p.team?._id === formData.teamId)
    }
    return projects
  }, [formData.teamId, projects])

  // Handle project selection change
  const handleProjectChange = useCallback((e) => {
    const selectedProjectId = e.target.value
    setFormData(prev => {
      const newData = { ...prev, projectId: selectedProjectId }
      
      // If project is selected, auto-set the team
      if (selectedProjectId) {
        const project = projects.find(p => p._id === selectedProjectId)
        if (project?.team?._id) {
          newData.teamId = project.team._id
        }
      }
      
      // Clear assignee if they're not in the new project/team
      if (prev.assignee) {
        const newMembers = selectedProjectId 
          ? projects.find(p => p._id === selectedProjectId)?.members?.map(m => m.user) || []
          : newData.teamId 
          ? teams.find(t => t._id === newData.teamId)?.members?.map(m => m.user) || []
          : []
        
        if (!newMembers.find(m => m._id === prev.assignee) && prev.assignee !== user._id) {
          newData.assignee = ''
        }
      }
      
      return newData
    })
  }, [projects, teams, user])

  // Handle team selection change
  const handleTeamChange = useCallback((e) => {
    const selectedTeamId = e.target.value
    setFormData(prev => {
      const newData = { ...prev, teamId: selectedTeamId }
      
      // Clear project if it doesn't belong to the selected team
      if (prev.projectId && selectedTeamId) {
        const project = projects.find(p => p._id === prev.projectId)
        if (project?.team?._id !== selectedTeamId) {
          newData.projectId = ''
        }
      }
      
      // Clear assignee if they're not in the new team
      if (prev.assignee && selectedTeamId) {
        const team = teams.find(t => t._id === selectedTeamId)
        const teamMembers = team?.members?.map(m => m.user) || []
        if (!teamMembers.find(m => m._id === prev.assignee) && prev.assignee !== user._id) {
          newData.assignee = ''
        }
      }
      
      return newData
    })
  }, [projects, teams, user])

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      console.log('❌ [TaskForm] Form validation failed');
      return
    }

    const submitData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      due: new Date(formData.due).toISOString(),
      assignee: formData.assignee || null,
      projectId: formData.projectId || null,
      teamId: formData.teamId || null
    }


    console.log('📝 [TaskForm] Assignment details:', {
      assigneeId: submitData.assignee,
      assigneeName: availableMembers.find(m => m._id === submitData.assignee)?.fullname || 'Unassigned',
      projectId: submitData.projectId,
      projectName: availableProjects.find(p => p._id === submitData.projectId)?.name || 'No Project',
      teamId: submitData.teamId,
      teamName: teams.find(t => t._id === submitData.teamId)?.name || 'No Team'
    });

    try {
      await onSubmit(submitData)
      console.log(' [TaskForm] onSubmit completed successfully');
    } catch (error) {
      console.error(' [TaskForm] Form submission error:', error)
    }
  }, [formData, validateForm, onSubmit, availableMembers, availableProjects, teams])

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6 border-b border-secondary-200 dark:border-secondary-700 pb-4">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </h2>
        <button
          type="button"
          className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
          onClick={onCancel}
          aria-label="Close form"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
          />
          {errors.title && <span className="text-red-600 dark:text-red-400 text-sm mt-1 block">{errors.title}</span>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter task description..."
            rows={4}
            maxLength={1000}
            disabled={loading}
          />
          <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 text-right">
            {formData.description.length}/1000
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="due" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              id="due"
              name="due"
              value={formData.due}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.due 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-secondary-300 dark:border-secondary-600'
              }`}
              min={format(new Date(), 'yyyy-MM-dd')}
              disabled={loading}
            />
            {errors.due && <span className="text-red-600 dark:text-red-400 text-sm mt-1 block">{errors.due}</span>}
          </div>

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
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {errors.priority && <span className="text-red-600 dark:text-red-400 text-sm mt-1 block">{errors.priority}</span>}
          </div>
        </div>

        {/* Team and Project Assignment */}
        {(showProjectSelection || showAssignment) && (
          <div className="space-y-6 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2" />
              Team Collaboration
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {showProjectSelection && (
                <div>
                  <label htmlFor="teamId" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Team
                  </label>
                  <select
                    id="teamId"
                    name="teamId"
                    value={formData.teamId}
                    onChange={handleTeamChange}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    <option value="">No Team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {showProjectSelection && (
                <div>
                  <label htmlFor="projectId" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Project
                  </label>
                  <select
                    id="projectId"
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    <option value="">No Project</option>
                    {availableProjects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                        {project.team && ` (${project.team.name})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {showAssignment && (
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Assign To
                </label>
                <select
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={loading}
                >
                  <option value="">Unassigned</option>
                  {availableMembers.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.fullname || member.name || member.username || 'Unknown User'} {member._id === user._id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
                
                {/* Show selected assignee info */}
                {formData.assignee && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400">
                    <UserIcon className="w-4 h-4" />
                    <span>
                      Assigned to: {availableMembers.find(m => m._id === formData.assignee)?.fullname || availableMembers.find(m => m._id === formData.assignee)?.name || availableMembers.find(m => m._id === formData.assignee)?.username || 'Unknown User'}
                      {formData.assignee === user._id && ' (You)'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Show context info */}
            {(formData.teamId || formData.projectId) && (
              <div className="text-sm text-secondary-600 dark:text-secondary-400 space-y-1">
                {formData.teamId && (
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4" />
                    <span>Team: {teams.find(t => t._id === formData.teamId)?.name}</span>
                  </div>
                )}
                {formData.projectId && (
                  <div className="flex items-center space-x-2">
                    <FolderIcon className="w-4 h-4" />
                    <span>Project: {availableProjects.find(p => p._id === formData.projectId)?.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Tags
          </label>
          <div className="border border-secondary-300 dark:border-secondary-600 rounded-lg p-2 bg-white dark:bg-secondary-700">
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm rounded-full">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
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

        <div>
          <label htmlFor="labels" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Labels
          </label>
          <div className="border border-secondary-300 dark:border-secondary-600 rounded-lg p-2 bg-white dark:bg-secondary-700">
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.labels.map((label, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-sm rounded-full">
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="ml-2 text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200"
                    aria-label={`Remove label ${label}`}
                  >
                    ×
                  </button>
                </span>
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
          <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
            Press Enter or comma to add labels
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-secondary-200 dark:border-secondary-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <LoadingSpinner size="small" />
                <span className="ml-2">{isEditing ? 'Updating...' : 'Creating...'}</span>
              </div>
            ) : (
              isEditing ? 'Update Task' : 'Create Task'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskForm