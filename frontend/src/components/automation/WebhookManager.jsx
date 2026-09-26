import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Edit, Trash2, Play, Pause, Settings, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const WebhookManager = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [],
    secret: '',
    headers: {}
  });

  const availableEvents = [
    { id: 'task.created', label: 'Task Created' },
    { id: 'task.updated', label: 'Task Updated' },
    { id: 'task.completed', label: 'Task Completed' },
    { id: 'task.deleted', label: 'Task Deleted' },
    { id: 'task.overdue', label: 'Task Overdue' },
    { id: 'project.created', label: 'Project Created' },
    { id: 'project.updated', label: 'Project Updated' },
    { id: 'project.completed', label: 'Project Completed' },
    { id: 'member.added', label: 'Member Added' },
    { id: 'member.removed', label: 'Member Removed' }
  ];

  useEffect(() => {
    // Sample webhooks
    const sampleWebhooks = [
      {
        id: 'webhook-1',
        name: 'Slack Notifications',
        url: '',
        events: ['task.created', 'task.completed', 'task.overdue'],
        isActive: true,
        secret: 'whsec_1234567890abcdef',
        createdAt: new Date('2024-01-15'),
        lastTriggered: new Date(Date.now() - 30 * 60 * 1000),
        successCount: 45,
        failureCount: 2,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TaskFlow-Webhook/1.0'
        }
      },
      {
        id: 'webhook-2',
        name: 'Project Management Tool',
        url: 'https://api.projecttool.com/webhooks/taskflow',
        events: ['task.created', 'task.updated', 'task.completed'],
        isActive: true,
        secret: 'whsec_abcdef1234567890',
        createdAt: new Date('2024-02-01'),
        lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
        successCount: 123,
        failureCount: 5,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123'
        }
      },
      {
        id: 'webhook-3',
        name: 'Analytics Dashboard',
        url: 'https://analytics.company.com/api/webhooks/tasks',
        events: ['task.created', 'task.completed', 'project.completed'],
        isActive: false,
        secret: 'whsec_fedcba0987654321',
        createdAt: new Date('2024-02-15'),
        lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000),
        successCount: 67,
        failureCount: 8,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ];

    setWebhooks(sampleWebhooks);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingWebhook) {
      setWebhooks(webhooks.map(webhook =>
        webhook.id === editingWebhook.id
          ? { ...webhook, ...formData }
          : webhook
      ));
    } else {
      const newWebhook = {
        id: `webhook-${Date.now()}`,
        ...formData,
        isActive: true,
        createdAt: new Date(),
        lastTriggered: null,
        successCount: 0,
        failureCount: 0
      };

      setWebhooks([...webhooks, newWebhook]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      secret: '',
      headers: {}
    });
    setShowForm(false);
    setEditingWebhook(null);
  };

  const handleEdit = (webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      headers: webhook.headers
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      setWebhooks(webhooks.filter(webhook => webhook.id !== id));
    }
  };

  const toggleWebhook = (id) => {
    setWebhooks(webhooks.map(webhook =>
      webhook.id === id
        ? { ...webhook, isActive: !webhook.isActive }
        : webhook
    ));
  };

  const testWebhook = async (webhook) => {
    console.log('Testing webhook:', webhook.name);

    setWebhooks(webhooks.map(item =>
      item.id === webhook.id
        ? { ...item, lastTriggered: new Date() }
        : item
    ));

    alert(`Test webhook sent to ${webhook.name}`);
  };

  const toggleEvent = (eventId) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(id => id !== eventId)
        : [...prev.events, eventId]
    }));
  };

  const getEventLabel = (eventId) => {
    const event = availableEvents.find(e => e.id === eventId);
    return event ? event.label : eventId;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Webhook Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your webhook integrations
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Webhook
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
            </h2>

            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="My Webhook"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret
                </label>
                <input
                  type="text"
                  value={formData.secret}
                  onChange={(e) =>
                    setFormData({ ...formData, secret: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Webhook secret"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Events
              </label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableEvents.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="bg-white rounded-lg shadow-md p-5"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Webhook className="text-blue-600" size={22} />
                </div>

                <div>
                  <h3 className="font-semibold text-lg">
                    {webhook.name}
                  </h3>

                  <p className="text-sm text-gray-500 break-all">
                    {webhook.url || 'No webhook URL configured'}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    {webhook.isActive ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <Pause size={14} />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => testWebhook(webhook)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  title="Test webhook"
                >
                  <Play size={18} />
                </button>

                <button
                  onClick={() => toggleWebhook(webhook.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title={webhook.isActive ? 'Pause' : 'Activate'}
                >
                  {webhook.isActive ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} />
                  )}
                </button>

                <button
                  onClick={() => handleEdit(webhook)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  title="Edit webhook"
                >
                  <Edit size={18} />
                </button>

                <button
                  onClick={() => handleDelete(webhook.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete webhook"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {getEventLabel(event)}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">
                    {webhook.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Last Triggered</p>
                  <p className="font-medium">
                    {webhook.lastTriggered
                      ? webhook.lastTriggered.toLocaleString()
                      : 'Never'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Successful</p>
                  <p className="font-medium text-green-600">
                    {webhook.successCount}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Failed</p>
                  <p className="font-medium text-red-600">
                    {webhook.failureCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {webhooks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <Webhook className="mx-auto text-gray-400" size={48} />

            <h3 className="mt-3 text-lg font-semibold text-gray-700">
              No webhooks
            </h3>

            <p className="text-gray-500 mt-1">
              Add a webhook to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookManager;