// Offline Manager for handling offline functionality
class OfflineManager {
  constructor() {
    this.dbName = 'TaskFlowOffline';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    
    this.init();
  }
  
  async init() {
    // Initialize IndexedDB
    await this.initDB();
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        //console.log('Service Worker registered:', registration);
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              this.notifyUpdate();
            }
          });
        });
      } catch (error) {
        //console.error('Service Worker registration failed:', error);
      }
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('action', 'action', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  // Handle online event
  async handleOnline() {
    //console.log('Connection restored');
    this.isOnline = true;
    
    // Trigger background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-tasks');
      await registration.sync.register('sync-user-data');
    } else {
      // Fallback sync
      await this.syncOfflineData();
    }
    
    // Notify user
    this.showNotification('Back Online', 'Your data is being synced...');
  }
  
  // Handle offline event
  handleOffline() {
    //console.log('Connection lost');
    this.isOnline = false;
    this.showNotification('Offline Mode', 'You can continue working offline');
  }
  
  // Store data offline
  async storeOffline(storeName, data) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put({
        ...data,
        _offline: true,
        _timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get offline data
  async getOfflineData(storeName, query = null) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request;
      if (query) {
        const index = store.index(query.index);
        request = index.getAll(query.value);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Add to sync queue
  async addToSyncQueue(action, data) {
    if (!this.db) await this.initDB();
    
    const syncItem = {
      action,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const request = store.add(syncItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Sync offline data
  async syncOfflineData() {
    if (!this.isOnline) return;
    
    try {
      const syncQueue = await this.getOfflineData('syncQueue');
      
      for (const item of syncQueue) {
        try {
          await this.processSyncItem(item);
          await this.removeFromSyncQueue(item.id);
        } catch (error) {
          //console.error('Sync failed for item:', item.id, error);
          await this.updateSyncItemRetries(item.id);
        }
      }
    } catch (error) {
      //console.error('Sync process failed:', error);
    }
  }
  
  // Process individual sync item
  async processSyncItem(item) {
    const { action, data } = item;
    
    switch (action) {
      case 'CREATE_TASK':
        return await this.syncCreateTask(data);
      case 'UPDATE_TASK':
        return await this.syncUpdateTask(data);
      case 'DELETE_TASK':
        return await this.syncDeleteTask(data);
      case 'UPDATE_USER':
        return await this.syncUpdateUser(data);
      default:
        throw new Error(`Unknown sync action: ${action}`);
    }
  }
  
  // Sync methods
  async syncCreateTask(taskData) {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async syncUpdateTask(taskData) {
    const response = await fetch(`/api/tasks/${taskData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async syncDeleteTask(taskData) {
    const response = await fetch(`/api/tasks/${taskData.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return true;
  }
  
  async syncUpdateUser(userData) {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Remove from sync queue
  async removeFromSyncQueue(id) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Update retry count
  async updateSyncItemRetries(id) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retries = (item.retries || 0) + 1;
          
          // Remove item if too many retries
          if (item.retries > 3) {
            store.delete(id);
          } else {
            store.put(item);
          }
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
  
  // Show notification
  showNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Remove actions and other service worker specific options for regular notifications
      const { actions, ...safeOptions } = options;
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...safeOptions
      });
    }
  }
  
  // Notify about app update
  notifyUpdate() {
    this.showNotification(
      'App Update Available',
      'A new version of TaskFlow is available. Refresh to update.',
      {
        requireInteraction: true,
        actions: [
          { action: 'refresh', title: 'Refresh Now' },
          { action: 'dismiss', title: 'Later' }
        ]
      }
    );
  }
  
  // Check if offline
  isOffline() {
    return !this.isOnline;
  }
  
  // Get sync queue status
  async getSyncQueueStatus() {
    const queue = await this.getOfflineData('syncQueue');
    return {
      pending: queue.length,
      items: queue
    };
  }
  
  // Clear all offline data
  async clearOfflineData() {
    if (!this.db) await this.initDB();
    
    const stores = ['tasks', 'user', 'syncQueue'];
    
    return Promise.all(
      stores.map(storeName => {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      })
    );
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

export default offlineManager;