import { useEffect, useCallback, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useNotification } from '../context/NotificationContext';

// Keyboard shortcut definitions
const SHORTCUTS = {
  // Global shortcuts
  'cmd+k': { action: 'openGlobalSearch', description: 'Open global search' },
  'ctrl+k': { action: 'openGlobalSearch', description: 'Open global search' },
  'cmd+n': { action: 'createTask', description: 'Create new task' },
  'ctrl+n': { action: 'createTask', description: 'Create new task' },
  'cmd+shift+n': { action: 'createProject', description: 'Create new project' },
  'ctrl+shift+n': { action: 'createProject', description: 'Create new project' },
  'cmd+,': { action: 'openSettings', description: 'Open settings' },
  'ctrl+,': { action: 'openSettings', description: 'Open settings' },
  'cmd+/': { action: 'showShortcuts', description: 'Show keyboard shortcuts' },
  'ctrl+/': { action: 'showShortcuts', description: 'Show keyboard shortcuts' },
  
  // Navigation shortcuts
  'g d': { action: 'goToDashboard', description: 'Go to dashboard' },
  'g t': { action: 'goToTasks', description: 'Go to tasks' },
  'g p': { action: 'goToProjects', description: 'Go to projects' },
  'g a': { action: 'goToAnalytics', description: 'Go to analytics' },
  'g s': { action: 'goToSettings', description: 'Go to settings' },
  
  // Task management shortcuts
  'c': { action: 'createTask', description: 'Create task (when in tasks view)' },
  'e': { action: 'editSelectedTask', description: 'Edit selected task' },
  'del': { action: 'deleteSelectedTask', description: 'Delete selected task' },
  'space': { action: 'toggleTaskComplete', description: 'Toggle task completion' },
  'cmd+a': { action: 'selectAllTasks', description: 'Select all tasks' },
  'ctrl+a': { action: 'selectAllTasks', description: 'Select all tasks' },
  'escape': { action: 'clearSelection', description: 'Clear selection' },
  
  // View shortcuts
  '1': { action: 'switchToListView', description: 'Switch to list view' },
  '2': { action: 'switchToBoardView', description: 'Switch to board view' },
  '3': { action: 'switchToCalendarView', description: 'Switch to calendar view' },
  '4': { action: 'switchToTimelineView', description: 'Switch to timeline view' },
  
  // Filter shortcuts
  'f': { action: 'focusFilter', description: 'Focus filter input' },
  'cmd+f': { action: 'focusSearch', description: 'Focus search input' },
  'ctrl+f': { action: 'focusSearch', description: 'Focus search input' },
  
  // Theme shortcuts
  'cmd+shift+l': { action: 'toggleTheme', description: 'Toggle theme' },
  'ctrl+shift+l': { action: 'toggleTheme', description: 'Toggle theme' },
  
  // Bulk actions
  'cmd+shift+d': { action: 'bulkDelete', description: 'Delete selected tasks' },
  'ctrl+shift+d': { action: 'bulkDelete', description: 'Delete selected tasks' },
  'cmd+shift+c': { action: 'bulkComplete', description: 'Complete selected tasks' },
  'ctrl+shift+c': { action: 'bulkComplete', description: 'Complete selected tasks' }
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (options = {}) => {
  const { 
    enabled = true, 
    scope = 'global',
    customShortcuts = {},
    onShortcut
  } = options;
  
  const appState = useAppState();
  const { showSuccess, showInfo } = useNotification();
  const sequenceRef = useRef('');
  const sequenceTimeoutRef = useRef(null);

  // Merge custom shortcuts with default ones
  const allShortcuts = { ...SHORTCUTS, ...customShortcuts };

  // Check if element should ignore shortcuts
  const shouldIgnoreShortcut = useCallback((target) => {
    const tagName = target.tagName.toLowerCase();
    const isEditable = target.isContentEditable || 
                      target.getAttribute('contenteditable') === 'true';
    const isInput = ['input', 'textarea', 'select'].includes(tagName);
    
    return isInput || isEditable;
  }, []);

  // Execute shortcut action
  const executeAction = useCallback((action, event) => {
    if (onShortcut) {
      const handled = onShortcut(action, event);
      if (handled) return;
    }

    switch (action) {
      // Global actions
      case 'openGlobalSearch':
        appState.setGlobalSearch(true);
        break;
      
      case 'createTask':
        appState.setTaskCreateModal(true);
        break;
      
      case 'createProject':
        appState.setProjectCreateModal(true);
        break;
      
      case 'openSettings':
        appState.setSettingsModal(true);
        break;
      
      case 'showShortcuts':
        showShortcutsModal();
        break;
      
      // Navigation actions
      case 'goToDashboard':
        window.location.href = '/dashboard';
        break;
      
      case 'goToTasks':
        window.location.href = '/tasks';
        break;
      
      case 'goToProjects':
        window.location.href = '/projects';
        break;
      
      case 'goToAnalytics':
        window.location.href = '/analytics';
        break;
      
      case 'goToSettings':
        window.location.href = '/settings';
        break;
      
      // Task management actions
      case 'editSelectedTask':
        if (appState.selectedTasks.length === 1) {
          const task = appState.tasks.find(t => t.id === appState.selectedTasks[0]);
          if (task) {
            appState.setTaskEditModal(true);
          }
        } else {
          showInfo('Please select exactly one task to edit');
        }
        break;
      
      case 'deleteSelectedTask':
        if (appState.selectedTasks.length > 0) {
          appState.selectedTasks.forEach(taskId => {
            appState.deleteTask(taskId);
          });
          showSuccess(`Deleted ${appState.selectedTasks.length} task(s)`);
          appState.clearTaskSelection();
        } else {
          showInfo('Please select tasks to delete');
        }
        break;
      
      case 'toggleTaskComplete':
        if (appState.selectedTasks.length > 0) {
          appState.selectedTasks.forEach(taskId => {
            const task = appState.tasks.find(t => t.id === taskId);
            if (task) {
              appState.updateTask({
                ...task,
                status: task.status === 'completed' ? 'todo' : 'completed'
              });
            }
          });
        }
        break;
      
      case 'selectAllTasks':
        const allTaskIds = appState.filteredTasks.map(task => task.id);
        appState.setSelectedTasks(allTaskIds);
        showInfo(`Selected ${allTaskIds.length} tasks`);
        break;
      
      case 'clearSelection':
        appState.clearTaskSelection();
        break;
      
      // View actions
      case 'switchToListView':
        appState.setCurrentView('list');
        showInfo('Switched to list view');
        break;
      
      case 'switchToBoardView':
        appState.setCurrentView('board');
        showInfo('Switched to board view');
        break;
      
      case 'switchToCalendarView':
        appState.setCurrentView('calendar');
        showInfo('Switched to calendar view');
        break;
      
      case 'switchToTimelineView':
        appState.setCurrentView('timeline');
        showInfo('Switched to timeline view');
        break;
      
      // Filter actions
      case 'focusFilter':
        const filterInput = document.querySelector('[data-shortcut="filter-input"]');
        if (filterInput) {
          filterInput.focus();
        }
        break;
      
      case 'focusSearch':
        const searchInput = document.querySelector('[data-shortcut="search-input"]');
        if (searchInput) {
          searchInput.focus();
        } else {
          appState.setGlobalSearch(true);
        }
        break;
      
      // Theme actions
      case 'toggleTheme':
        // This would be handled by theme context
        document.dispatchEvent(new CustomEvent('toggleTheme'));
        break;
      
      // Bulk actions
      case 'bulkDelete':
        if (appState.selectedTasks.length > 0) {
          if (confirm(`Delete ${appState.selectedTasks.length} selected tasks?`)) {
            appState.selectedTasks.forEach(taskId => {
              appState.deleteTask(taskId);
            });
            showSuccess(`Deleted ${appState.selectedTasks.length} tasks`);
            appState.clearTaskSelection();
          }
        }
        break;
      
      case 'bulkComplete':
        if (appState.selectedTasks.length > 0) {
          appState.selectedTasks.forEach(taskId => {
            const task = appState.tasks.find(t => t.id === taskId);
            if (task && task.status !== 'completed') {
              appState.updateTask({ ...task, status: 'completed' });
            }
          });
          showSuccess(`Completed ${appState.selectedTasks.length} tasks`);
          appState.clearTaskSelection();
        }
        break;
      
      default:
        //console.warn(`Unknown shortcut action: ${action}`);
    }
  }, [appState, showSuccess, showInfo, onShortcut]);

  // Show shortcuts modal
  const showShortcutsModal = useCallback(() => {
    // Create and show shortcuts modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="p-6 border-b border-secondary-200 dark:border-secondary-700">
          <h2 class="text-xl font-bold text-secondary-900 dark:text-secondary-100">Keyboard Shortcuts</h2>
          <button class="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600" onclick="this.closest('.fixed').remove()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${Object.entries(allShortcuts).map(([key, { description }]) => `
              <div class="flex items-center justify-between">
                <span class="text-sm text-secondary-600 dark:text-secondary-400">${description}</span>
                <kbd class="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 rounded text-xs font-mono">${key}</kbd>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Close on escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }, [allShortcuts]);

  // Handle key combinations
  const handleKeyDown = useCallback((event) => {
    if (!enabled || shouldIgnoreShortcut(event.target)) {
      return;
    }

    const { key, metaKey, ctrlKey, shiftKey, altKey } = event;
    
    // Build key combination string
    let combination = '';
    
    if (metaKey) combination += 'cmd+';
    if (ctrlKey) combination += 'ctrl+';
    if (shiftKey) combination += 'shift+';
    if (altKey) combination += 'alt+';
    
    // Handle special keys
    const specialKeys = {
      ' ': 'space',
      'Delete': 'del',
      'Backspace': 'backspace',
      'Enter': 'enter',
      'Escape': 'escape',
      'Tab': 'tab'
    };
    
    const normalizedKey = specialKeys[key] || key.toLowerCase();
    combination += normalizedKey;

    // Handle sequence shortcuts (like 'g d')
    if (!metaKey && !ctrlKey && !shiftKey && !altKey && key.length === 1) {
      sequenceRef.current += key.toLowerCase();
      
      // Clear sequence after timeout
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
      
      sequenceTimeoutRef.current = setTimeout(() => {
        sequenceRef.current = '';
      }, 1000);
      
      // Check for sequence shortcuts
      const sequenceShortcut = allShortcuts[sequenceRef.current];
      if (sequenceShortcut) {
        event.preventDefault();
        executeAction(sequenceShortcut.action, event);
        sequenceRef.current = '';
        return;
      }
    } else {
      // Clear sequence for modifier combinations
      sequenceRef.current = '';
    }

    // Check for direct shortcuts
    const shortcut = allShortcuts[combination];
    if (shortcut) {
      event.preventDefault();
      executeAction(shortcut.action, event);
    }
  }, [enabled, shouldIgnoreShortcut, allShortcuts, executeAction]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [enabled, handleKeyDown]);

  // Return shortcut utilities
  return {
    shortcuts: allShortcuts,
    executeAction,
    showShortcutsModal
  };
};

// Hook for component-specific shortcuts
export const useComponentShortcuts = (shortcuts, dependencies = []) => {
  const { executeAction } = useKeyboardShortcuts({ enabled: false });

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, metaKey, ctrlKey, shiftKey } = event;
      
      let combination = '';
      if (metaKey) combination += 'cmd+';
      if (ctrlKey) combination += 'ctrl+';
      if (shiftKey) combination += 'shift+';
      combination += key.toLowerCase();

      const shortcut = shortcuts[combination];
      if (shortcut) {
        event.preventDefault();
        event.stopPropagation();
        
        if (typeof shortcut === 'function') {
          shortcut(event);
        } else if (typeof shortcut === 'string') {
          executeAction(shortcut, event);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, executeAction, ...dependencies]);
};

export default useKeyboardShortcuts;