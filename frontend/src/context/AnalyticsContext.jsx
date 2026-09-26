import React, { createContext, useContext, useState, useCallback } from 'react'

const AnalyticsContext = createContext()

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

export const AnalyticsProvider = ({ children }) => {
  const [analyticsListeners, setAnalyticsListeners] = useState(new Set())

  // Register a listener for analytics updates
  const registerAnalyticsListener = useCallback((listener) => {
    setAnalyticsListeners(prev => new Set([...prev, listener]))
    
    // Return cleanup function
    return () => {
      setAnalyticsListeners(prev => {
        const newSet = new Set(prev)
        newSet.delete(listener)
        return newSet
      })
    }
  }, [])

  // Trigger analytics refresh for all listeners
  const triggerAnalyticsRefresh = useCallback((eventType, data) => {
    analyticsListeners.forEach(listener => {
      try {
        listener(eventType, data)
      } catch (error) {
        //console.error('Error in analytics listener:', error)
      }
    })
  }, [analyticsListeners])

  // Specific event triggers
  const onTaskCompleted = useCallback((taskData) => {
    triggerAnalyticsRefresh('TASK_COMPLETED', taskData)
  }, [triggerAnalyticsRefresh])

  const onTaskCreated = useCallback((taskData) => {
    triggerAnalyticsRefresh('TASK_CREATED', taskData)
  }, [triggerAnalyticsRefresh])

  const onTaskUpdated = useCallback((taskData) => {
    triggerAnalyticsRefresh('TASK_UPDATED', taskData)
  }, [triggerAnalyticsRefresh])

  const onTaskDeleted = useCallback((taskData) => {
    triggerAnalyticsRefresh('TASK_DELETED', taskData)
  }, [triggerAnalyticsRefresh])

  const value = {
    registerAnalyticsListener,
    triggerAnalyticsRefresh,
    onTaskCompleted,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export default AnalyticsContext