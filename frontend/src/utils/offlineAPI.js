import offlineManager from './offlineManager';

// Offline-aware API wrapper
class OfflineAPI {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
  }
  
  // Generic API request with offline handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache successful GET requests
      if (config.method === 'GET' || !config.method) {
        await this.cacheResponse(endpoint, data);
      }
      
      return data;
    } catch (error) {
      //console.error('API request failed:', error);
      
      // If offline or network error, try to handle gracefully
      if (!navigator.onLine || error.name === 'TypeError') {
        return await this.handleOfflineRequest(endpoint, config);
      }
      
      throw error;
    }
  }
  
  // Handle offline requests
  async handleOfflineRequest(endpoint, config) {
    const method = config.method || 'GET';
    
    switch (method) {
      case 'GET':
        return await this.getCachedResponse(endpoint);
      
      case 'POST':
        return await this.handleOfflineCreate(endpoint, config);
      
      case 'PUT':
      case 'PATCH':
        return await this.handleOfflineUpdate(endpoint, config);
      
      case 'DELETE':
        return await this.handleOfflineDelete(endpoint, config);
      
      default:
        throw new Error('This action is not available offline');
    }
  }
  
  // Cache API response
  async cacheResponse(endpoint, data) {
    try {
      const cacheKey = this.getCacheKey(endpoint);
      await offlineManager.storeOffline('apiCache', {
        id: cacheKey,
        endpoint,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      //console.error('Failed to cache response:', error);
    }
  }
  
  // Get cached response
  async getCachedResponse(endpoint) {
    try {
      const cacheKey = this.getCacheKey(endpoint);
      const cached = await offlineManager.getOfflineData('apiCache');
      const item = cached.find(c => c.id === cacheKey);
      
      if (item) {
        // Check if cache is still valid (24 hours)
        const isValid = Date.now() - item.timestamp < 24 * 60 * 60 * 1000;
        
        if (isValid) {
          return item.data;
        }
      }
      
      throw new Error('No cached data available');
    } catch (error) {
      throw new Error('This data is not available offline');
    }
  }
  
  // Handle offline create operations
  async handleOfflineCreate(endpoint, config) {
    const data = JSON.parse(config.body);
    
    // Generate temporary ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineData = {
      ...data,
      id: tempId,
      _offline: true,
      _tempId: tempId
    };
    
    // Store locally
    if (endpoint.includes('/tasks')) {
      await offlineManager.storeOffline('tasks', offlineData);
      await offlineManager.addToSyncQueue('CREATE_TASK', data);
    }
    
    return offlineData;
  }
  
  // Handle offline update operations
  async handleOfflineUpdate(endpoint, config) {
    const data = JSON.parse(config.body);
    const id = this.extractIdFromEndpoint(endpoint);
    
    // Update local data
    if (endpoint.includes('/tasks')) {
      await offlineManager.storeOffline('tasks', { ...data, id });
      await offlineManager.addToSyncQueue('UPDATE_TASK', { ...data, id });
    } else if (endpoint.includes('/user')) {
      await offlineManager.storeOffline('user', { ...data, id });
      await offlineManager.addToSyncQueue('UPDATE_USER', { ...data, id });
    }
    
    return { ...data, id };
  }
  
  // Handle offline delete operations
  async handleOfflineDelete(endpoint, config) {
    const id = this.extractIdFromEndpoint(endpoint);
    
    if (endpoint.includes('/tasks')) {
      // Mark as deleted locally
      await offlineManager.storeOffline('tasks', {
        id,
        _deleted: true,
        _offline: true
      });
      await offlineManager.addToSyncQueue('DELETE_TASK', { id });
    }
    
    return { success: true };
  }
  
  // Utility methods
  getCacheKey(endpoint) {
    return btoa(endpoint).replace(/[^a-zA-Z0-9]/g, '');
  }
  
  extractIdFromEndpoint(endpoint) {
    const parts = endpoint.split('/');
    return parts[parts.length - 1];
  }
  
  // Specific API methods
  async getTasks(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
    
    try {
      return await this.request(endpoint);
    } catch (error) {
      // Fallback to offline tasks
      const offlineTasks = await offlineManager.getOfflineData('tasks');
      return offlineTasks.filter(task => !task._deleted);
    }
  }
  
  async createTask(taskData) {
    return await this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }
  
  async updateTask(id, taskData) {
    return await this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  }
  
  async deleteTask(id) {
    return await this.request(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }
  
  async getUserProfile() {
    try {
      return await this.request('/user/profile');
    } catch (error) {
      const offlineUser = await offlineManager.getOfflineData('user');
      if (offlineUser.length > 0) {
        return offlineUser[0];
      }
      throw error;
    }
  }
  
  async updateUserProfile(userData) {
    return await this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }
  
  async getDashboardStats() {
    try {
      return await this.request('/dashboard/stats');
    } catch (error) {
      // Generate offline stats from local data
      const tasks = await offlineManager.getOfflineData('tasks');
      const completedTasks = tasks.filter(t => t.status === 'completed' && !t._deleted);
      const pendingTasks = tasks.filter(t => t.status !== 'completed' && !t._deleted);
      
      return {
        totalTasks: tasks.filter(t => !t._deleted).length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
        _offline: true
      };
    }
  }
  
  // Sync status
  async getSyncStatus() {
    return await offlineManager.getSyncQueueStatus();
  }
  
  // Force sync
  async forceSync() {
    if (navigator.onLine) {
      await offlineManager.syncOfflineData();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }
}

// Create singleton instance
const offlineAPI = new OfflineAPI();

export default offlineAPI;