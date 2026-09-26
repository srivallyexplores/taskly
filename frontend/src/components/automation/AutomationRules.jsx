import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BoltIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';

const AutomationRules = ({ onRuleCreate, onRuleUpdate, className = '' }) => {
  const [rules, setRules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleStats, setRuleStats] = useState({});
  
  // Sample automation rules
  useEffect(() => {
    const sampleRules = [
      {
        id: 'rule-1',
        name: 'Auto-assign high priority tasks',
        description: 'Automatically assign high priority tasks to team lead',
        trigger: {
          type: 'task_created',
          conditions: [
            { field: 'priority', operator: 'equals', value: 'high' }
          ]
        },
        actions: [
          { type: 'assign_user', value: 'team-lead@company.com' },
          { type: 'add_tag', value: 'urgent' },
          { type: 'send_notification', value: 'team-lead@company.com' }
        ],
        isActive: true,
        createdAt: new Date('2024-01-15'),
        lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
        triggerCount: 15
      },
      {
        id: 'rule-2',
        name: 'Overdue task notifications',
        description: 'Send notifications for overdue tasks',
        trigger: {
          type: 'schedule',
          schedule: 'daily',
          time: '09:00',
          conditions: [
            { field: 'due_date', operator: 'less_than', value: 'today' },
            { field: 'status', operator: 'not_equals', value: 'completed' }
          ]
        },
        actions: [
          { type: 'send_email', value: 'assignee' },
          { type: 'add_tag', value: 'overdue' },
          { type: 'update_priority', value: 'high' }
        ],
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000),
        triggerCount: 8
      },
      {
        id: 'rule-3',
        name: 'Project completion workflow',
        description: 'Archive completed projects and notify stakeholders',
        trigger: {
          type: 'project_completed',
          conditions: [
            { field: 'completion_rate', operator: 'equals', value: '100%' }
          ]
        },
        actions: [
          { type: 'archive_project', value: true },
          { type: 'send_email', value: 'stakeholders' },
          { type: 'create_report', value: 'project_summary' }
        ],
        isActive: false,
        createdAt: new Date('2024-01-05'),
        lastTriggered: null,
        triggerCount: 0
      }
    ];
    
    setRules(sampleRules);
    
    // Sample stats
    setRuleStats({
      'rule-1': { executions: 15, successRate: 100, avgExecutionTime: 250 },
      'rule-2': { executions: 8, successRate: 87.5, avgExecutionTime: 180 },
      'rule-3': { executions: 0, successRate: 0, avgExecutionTime: 0 }
    });
  }, []);
  
  const triggerTypes = [
    { id: 'task_created', name: 'Task Created', description: 'When a new task is created' },
    { id: 'task_updated', name: 'Task Updated', description: 'When a task is modified' },
    { id: 'task_completed', name: 'Task Completed', description: 'When a task is marked as complete' },
    { id: 'task_overdue', name: 'Task Overdue', description: 'When a task becomes overdue' },
    { id: 'project_completed', name: 'Project Completed', description: 'When all project tasks are done' },
    { id: 'schedule', name: 'Schedule', description: 'At specific times or intervals' },
    { id: 'webhook', name: 'Webhook', description: 'When external system sends data' }
  ];
  
  const actionTypes = [
    { id: 'assign_user', name: 'Assign User', description: 'Assign task to a user' },
    { id: 'update_priority', name: 'Update Priority', description: 'Change task priority' },
    { id: 'add_tag', name: 'Add Tag', description: 'Add a tag to the task' },
    { id: 'send_email', name: 'Send Email', description: 'Send email notification' },
    { id: 'send_notification', name: 'Send Notification', description: 'Send in-app notification' },
    { id: 'create_task', name: 'Create Task', description: 'Create a new task' },
    { id: 'archive_project', name: 'Archive Project', description: 'Archive the project' },
    { id: 'webhook_call', name: 'Webhook Call', description: 'Call external webhook' }
  ];
  
  const operators = [
    { id: 'equals', name: 'Equals', symbol: '=' },
    { id: 'not_equals', name: 'Not Equals', symbol: '≠' },
    { id: 'greater_than', name: 'Greater Than', symbol: '>' },
    { id: 'less_than', name: 'Less Than', symbol: '<' },
    { id: 'contains', name: 'Contains', symbol: '∋' },
    { id: 'starts_with', name: 'Starts With', symbol: '⌐' },
    { id: 'ends_with', name: 'Ends With', symbol: '⌐' }
  ];
  
  const toggleRule = (ruleId) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
  };
  
  const deleteRule = (ruleId) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  };
  
  const duplicateRule = (ruleId) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      const newRule = {
        ...rule,
        id: `rule-${Date.now()}`,
        name: `${rule.name} (Copy)`,
        isActive: false,
        createdAt: new Date(),
        lastTriggered: null,
        triggerCount: 0
      };
      setRules(prev => [...prev, newRule]);
    }
  };
  
  const getTriggerTypeName = (type) => {
    return triggerTypes.find(t => t.id === type)?.name || type;
  };
  
  const getActionTypeName = (type) => {
    return actionTypes.find(a => a.id === type)?.name || type;
  };
  
  const formatLastTriggered = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  const CreateRuleModal = () => {
    const [newRule, setNewRule] = useState({
      name: '',
      description: '',
      trigger: {
        type: 'task_created',
        conditions: [{ field: 'priority', operator: 'equals', value: '' }]
      },
      actions: [{ type: 'assign_user', value: '' }],
      isActive: true
    });
    
    const handleSubmit = (e) => {
      e.preventDefault();
      
      const rule = {
        ...newRule,
        id: `rule-${Date.now()}`,
        createdAt: new Date(),
        lastTriggered: null,
        triggerCount: 0
      };
      
      setRules(prev => [...prev, rule]);
      onRuleCreate?.(rule);
      setShowCreateModal(false);
      
      // Reset form
      setNewRule({
        name: '',
        description: '',
        trigger: {
          type: 'task_created',
          conditions: [{ field: 'priority', operator: 'equals', value: '' }]
        },
        actions: [{ type: 'assign_user', value: '' }],
        isActive: true
      });
    };
    
    const addCondition = () => {
      setNewRule(prev => ({
        ...prev,
        trigger: {
          ...prev.trigger,
          conditions: [
            ...prev.trigger.conditions,
            { field: '', operator: 'equals', value: '' }
          ]
        }
      }));
    };
    
    const addAction = () => {
      setNewRule(prev => ({
        ...prev,
        actions: [...prev.actions, { type: 'assign_user', value: '' }]
      }));
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-700 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Create Automation Rule
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newRule.description}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                  />
                </div>
              </div>
              
              {/* Trigger */}
              <div>
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                  When (Trigger)
                </h4>
                
                <div className="space-y-3">
                  <select
                    value={newRule.trigger.type}
                    onChange={(e) => setNewRule(prev => ({
                      ...prev,
                      trigger: { ...prev.trigger, type: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                  >
                    {triggerTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.description}
                      </option>
                    ))}
                  </select>
                  
                  {/* Conditions */}
                  <div className="space-y-2">
                    {newRule.trigger.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Field"
                          value={condition.field}
                          onChange={(e) => {
                            const newConditions = [...newRule.trigger.conditions];
                            newConditions[index].field = e.target.value;
                            setNewRule(prev => ({
                              ...prev,
                              trigger: { ...prev.trigger, conditions: newConditions }
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                        />
                        
                        <select
                          value={condition.operator}
                          onChange={(e) => {
                            const newConditions = [...newRule.trigger.conditions];
                            newConditions[index].operator = e.target.value;
                            setNewRule(prev => ({
                              ...prev,
                              trigger: { ...prev.trigger, conditions: newConditions }
                            }));
                          }}
                          className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                        >
                          {operators.map(op => (
                            <option key={op.id} value={op.id}>
                              {op.name}
                            </option>
                          ))}
                        </select>
                        
                        <input
                          type="text"
                          placeholder="Value"
                          value={condition.value}
                          onChange={(e) => {
                            const newConditions = [...newRule.trigger.conditions];
                            newConditions[index].value = e.target.value;
                            setNewRule(prev => ({
                              ...prev,
                              trigger: { ...prev.trigger, conditions: newConditions }
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                        />
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addCondition}
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Condition
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div>
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                  Then (Actions)
                </h4>
                
                <div className="space-y-2">
                  {newRule.actions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <select
                        value={action.type}
                        onChange={(e) => {
                          const newActions = [...newRule.actions];
                          newActions[index].type = e.target.value;
                          setNewRule(prev => ({ ...prev, actions: newActions }));
                        }}
                        className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                      >
                        {actionTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        placeholder="Value"
                        value={action.value}
                        onChange={(e) => {
                          const newActions = [...newRule.actions];
                          newActions[index].value = e.target.value;
                          setNewRule(prev => ({ ...prev, actions: newActions }));
                        }}
                        className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                      />
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addAction}
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Action
                  </Button>
                </div>
              </div>
              
              {/* Submit */}
              <div className="flex space-x-3 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  Create Rule
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  };
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <BoltIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Automation Rules
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {rules.length} rule{rules.length !== 1 ? 's' : ''} • {rules.filter(r => r.isActive).length} active
            </p>
          </div>
        </div>
        
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>
      
      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => {
          const stats = ruleStats[rule.id] || { executions: 0, successRate: 0, avgExecutionTime: 0 };
          
          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                p-4 rounded-lg border transition-all duration-200
                ${rule.isActive 
                  ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/10' 
                  : 'border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-700/50'
                }
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                      {rule.name}
                    </h4>
                    <span className={`
                      text-xs px-2 py-1 rounded-full
                      ${rule.isActive 
                        ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300' 
                        : 'bg-secondary-200 text-secondary-700 dark:bg-secondary-600 dark:text-secondary-300'
                      }
                    `}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                    {rule.description}
                  </p>
                  
                  {/* Rule Logic */}
                  <div className="flex items-center space-x-2 text-xs text-secondary-500 dark:text-secondary-400">
                    <span className="font-medium">WHEN</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded">
                      {getTriggerTypeName(rule.trigger.type)}
                    </span>
                    <ArrowRightIcon className="w-3 h-3" />
                    <span className="font-medium">THEN</span>
                    <div className="flex space-x-1">
                      {rule.actions.slice(0, 2).map((action, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded">
                          {getActionTypeName(action.type)}
                        </span>
                      ))}
                      {rule.actions.length > 2 && (
                        <span className="text-secondary-500">+{rule.actions.length - 2} more</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRule(rule.id)}
                    className="p-2"
                  >
                    {rule.isActive ? (
                      <PauseIcon className="w-4 h-4 text-warning-600" />
                    ) : (
                      <PlayIcon className="w-4 h-4 text-success-600" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateRule(rule.id)}
                    className="p-2"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 text-error-600 hover:text-error-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-secondary-200 dark:border-secondary-600">
                <div className="flex items-center space-x-4 text-xs text-secondary-500 dark:text-secondary-400">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>Last: {formatLastTriggered(rule.lastTriggered)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    <span>Runs: {rule.triggerCount}</span>
                  </div>
                  {stats.executions > 0 && (
                    <div className="flex items-center space-x-1">
                      <span>Success: {stats.successRate}%</span>
                    </div>
                  )}
                </div>
                
                <span className="text-xs text-secondary-400 dark:text-secondary-500">
                  Created {rule.createdAt.toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          );
        })}
        
        {rules.length === 0 && (
          <div className="text-center py-8">
            <BoltIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
            <p className="text-secondary-500 dark:text-secondary-400">
              No automation rules yet
            </p>
            <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
              Create rules to automate your workflow
            </p>
          </div>
        )}
      </div>
      
      {/* Create Rule Modal */}
      <AnimatePresence>
        {showCreateModal && <CreateRuleModal />}
      </AnimatePresence>
    </div>
  );
};

export default AutomationRules;