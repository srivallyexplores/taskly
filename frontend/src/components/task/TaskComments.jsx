import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  AtSymbolIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';
import { useProject } from '../../context/ProjectContext';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import Dropdown from '../common/Dropdown';
import { formatDistanceToNow, format } from 'date-fns';

const TaskComments = ({ 
  taskId, 
  comments = [], 
  onAddComment, 
  onUpdateComment, 
  onDeleteComment,
  loading = false,
  teamId = null,
  projectId = null
}) => {
  const { user } = useAuth();
  const { currentTeam } = useTeam();
  const { currentProject } = useProject();
  
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);
  const mentionsRef = useRef(null);

  // Get available members for mentions
  const availableMembers = React.useMemo(() => {
    let members = [];
    
    if (projectId && currentProject?.members) {
      members = currentProject.members.map(m => m.user);
    } else if (teamId && currentTeam?.members) {
      members = currentTeam.members.map(m => m.user);
    }
    
    return members.filter(member => member._id !== user._id);
  }, [projectId, teamId, currentProject, currentTeam, user]);

  // Filter members based on mention query
  const filteredMembers = React.useMemo(() => {
    if (!mentionQuery) return availableMembers;
    
    return availableMembers.filter(member =>
      member.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [availableMembers, mentionQuery]);

  // Handle textarea input for mentions
  const handleTextareaChange = (e, isEdit = false) => {
    const value = e.target.value;
    const textarea = isEdit ? editTextareaRef.current : textareaRef.current;
    
    if (isEdit) {
      setEditText(value);
    } else {
      setNewComment(value);
    }

    // Check for @ mentions
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      
      // Calculate mention dropdown position
      const rect = textarea.getBoundingClientRect();
      const textMetrics = getTextMetrics(textBeforeCursor, textarea);
      setMentionPosition({
        top: rect.top + textMetrics.height + 25,
        left: rect.left + textMetrics.width
      });
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  // Get text metrics for positioning mentions dropdown
  const getTextMetrics = (text, textarea) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const style = window.getComputedStyle(textarea);
    
    context.font = `${style.fontSize} ${style.fontFamily}`;
    
    const lines = text.split('\n');
    const lineHeight = parseInt(style.lineHeight) || parseInt(style.fontSize) * 1.2;
    
    return {
      width: Math.max(...lines.map(line => context.measureText(line).width)),
      height: lines.length * lineHeight
    };
  };

  // Handle mention selection
  const handleMentionSelect = (member, isEdit = false) => {
    const textarea = isEdit ? editTextareaRef.current : textareaRef.current;
    const currentText = isEdit ? editText : newComment;
    const cursorPosition = textarea.selectionStart;
    
    // Find the @ symbol position
    const textBeforeCursor = currentText.substring(0, cursorPosition);
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    
    if (mentionStart !== -1) {
      const beforeMention = currentText.substring(0, mentionStart);
      const afterCursor = currentText.substring(cursorPosition);
      const newText = `${beforeMention}@${member.name} ${afterCursor}`;
      
      if (isEdit) {
        setEditText(newText);
      } else {
        setNewComment(newText);
      }
      
      // Set cursor position after the mention
      setTimeout(() => {
        const newCursorPos = mentionStart + member.name.length + 2;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
    
    setShowMentions(false);
    setMentionQuery('');
  };

  // Handle keyboard navigation in mentions
  const handleKeyDown = (e, isEdit = false) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Handle arrow key navigation in mentions
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleMentionSelect(filteredMembers[0], isEdit);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
        setMentionQuery('');
      }
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (isEdit) {
        handleUpdateComment();
      } else {
        handleAddComment();
      }
    }
  };

  // Handle adding new comment
  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const commentData = {
        text: newComment.trim(),
        mentions: extractMentions(newComment)
      };
      
      await onAddComment(taskId, commentData);
      setNewComment('');
    } catch (error) {
      //console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating comment
  const handleUpdateComment = async () => {
    if (!editText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const commentData = {
        text: editText.trim(),
        mentions: extractMentions(editText)
      };
      
      await onUpdateComment(editingComment._id, commentData);
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      //console.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting comment
  const handleDeleteComment = async (commentId) => {
    try {
      await onDeleteComment(commentId);
    } catch (error) {
      //console.error('Failed to delete comment:', error);
    }
  };

  // Extract mentions from text
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedUser = availableMembers.find(member => 
        member.name.toLowerCase() === match[1].toLowerCase()
      );
      if (mentionedUser) {
        mentions.push(mentionedUser._id);
      }
    }
    
    return mentions;
  };

  // Render comment text with mentions highlighted
  const renderCommentText = (text) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add mention
      const mentionedUser = availableMembers.find(member => 
        member.name.toLowerCase() === match[1].toLowerCase()
      );
      
      if (mentionedUser) {
        parts.push(
          <span
            key={match.index}
            className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-1 rounded font-medium"
          >
            @{mentionedUser.name}
          </span>
        );
      } else {
        parts.push(match[0]);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  // Start editing comment
  const startEditing = (comment) => {
    setEditingComment(comment);
    setEditText(comment.text);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  // Click outside to close mentions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mentionsRef.current && !mentionsRef.current.contains(event.target)) {
        setShowMentions(false);
      }
    };

    if (showMentions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMentions]);

  return (
    <div className="space-y-4">
      {/* Comments Header */}
      <div className="flex items-center space-x-2">
        <ChatBubbleLeftIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex space-x-3 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
            >
              <Avatar
                src={comment.author.avatar}
                name={comment.author.name}
                size="sm"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-secondary-900 dark:text-secondary-100">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">
                      {formatDistanceToNow(new Date(comment.createdAt))} ago
                    </span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-xs text-secondary-400 dark:text-secondary-500">
                        (edited)
                      </span>
                    )}
                  </div>
                  
                  {comment.author._id === user._id && (
                    <Dropdown
                      trigger={
                        <button className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300">
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>
                      }
                      items={[
                        {
                          label: 'Edit',
                          icon: PencilIcon,
                          onClick: () => startEditing(comment)
                        },
                        {
                          label: 'Delete',
                          icon: TrashIcon,
                          onClick: () => handleDeleteComment(comment._id),
                          className: 'text-red-600 dark:text-red-400'
                        }
                      ]}
                      align="right"
                    />
                  )}
                </div>
                
                {editingComment?._id === comment._id ? (
                  <div className="space-y-2">
                    <textarea
                      ref={editTextareaRef}
                      value={editText}
                      onChange={(e) => handleTextareaChange(e, true)}
                      onKeyDown={(e) => handleKeyDown(e, true)}
                      className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      rows={2}
                      placeholder="Edit your comment..."
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 text-sm text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateComment}
                        disabled={!editText.trim() || isSubmitting}
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                      >
                        {isSubmitting ? <LoadingSpinner size="xs" /> : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
                    {renderCommentText(comment.text)}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {comments.length === 0 && (
          <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
            <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="relative">
        <div className="flex space-x-3">
          <Avatar
            src={user.avatar}
            name={user.name}
            size="sm"
          />
          
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="Add a comment... Use @ to mention team members"
              disabled={loading}
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2 text-xs text-secondary-500 dark:text-secondary-400">
                <AtSymbolIcon className="w-4 h-4" />
                <span>Use @ to mention members</span>
                <span>•</span>
                <span>Ctrl+Enter to send</span>
              </div>
              
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting || loading}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <PaperAirplaneIcon className="w-4 h-4" />
                )}
                <span>Comment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mentions Dropdown */}
        {showMentions && filteredMembers.length > 0 && (
          <div
            ref={mentionsRef}
            className="absolute z-50 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            style={{
              top: mentionPosition.top,
              left: mentionPosition.left,
              minWidth: '200px'
            }}
          >
            {filteredMembers.map((member) => (
              <button
                key={member._id}
                onClick={() => handleMentionSelect(member)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              >
                <Avatar
                  src={member.avatar}
                  name={member.name}
                  size="xs"
                />
                <div>
                  <div className="font-medium text-secondary-900 dark:text-secondary-100">
                    {member.name}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">
                    {member.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskComments;