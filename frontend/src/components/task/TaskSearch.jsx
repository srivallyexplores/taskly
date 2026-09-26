import React, { useState, useCallback, useEffect, useRef } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import LoadingSpinner from '../common/LoadingSpinner'
import taskService from '../../services/taskService'

const TaskSearch = ({
  onSearchResults,
  onClearSearch,
  className = '',
  placeholder = 'Search tasks...'
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilters, setSearchFilters] = useState({
    status: '',
    priority: '',
    dateRange: '',
    customStartDate: '',
    customEndDate: '',
    tags: [],
    hasDescription: false
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [tagInput, setTagInput] = useState('')
  
  const searchInputRef = useRef(null)
  const debounceRef = useRef(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('taskSearchHistory')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        //console.error('Failed to load search history:', error)
      }
    }
  }, [])

  // Save search to history
  const saveSearchToHistory = useCallback((query, filters) => {
    if (!query.trim()) return

    const searchItem = {
      query,
      filters: { ...filters },
      timestamp: new Date().toISOString()
    }

    const newHistory = [
      searchItem,
      ...recentSearches.filter(item => item.query !== query)
    ].slice(0, 10) // Keep only last 10 searches

    setRecentSearches(newHistory)
    localStorage.setItem('taskSearchHistory', JSON.stringify(newHistory))
  }, [recentSearches])

  // Perform search
  const performSearch = useCallback(async (query, filters) => {
    if (!query.trim() && !hasActiveFilters(filters)) {
      setResults([])
      onClearSearch?.()
      return
    }

    setLoading(true)

    try {
      const searchOptions = {
        page: 1,
        limit: 50,
        ...filters
      }

      // Handle date range filters
      if (filters.dateRange) {
        const now = new Date()
        let startDate, endDate

        switch (filters.dateRange) {
          case 'today':
            startDate = endDate = format(now, 'yyyy-MM-dd')
            break
          case 'thisWeek':
            startDate = format(startOfWeek(now), 'yyyy-MM-dd')
            endDate = format(endOfWeek(now), 'yyyy-MM-dd')
            break
          case 'thisMonth':
            startDate = format(startOfMonth(now), 'yyyy-MM-dd')
            endDate = format(endOfMonth(now), 'yyyy-MM-dd')
            break
          case 'custom':
            startDate = filters.customStartDate
            endDate = filters.customEndDate
            break
        }

        if (startDate) searchOptions.startDate = startDate
        if (endDate) searchOptions.endDate = endDate
      }

      // Handle tags
      if (filters.tags.length > 0) {
        searchOptions.tags = filters.tags.join(',')
      }

      const response = await taskService.searchTasks(query, searchOptions)
      setResults(response.data.tasks || response.data || [])
      onSearchResults?.(response.data.tasks || response.data || [], query, filters)
      
      if (query.trim()) {
        saveSearchToHistory(query, filters)
      }
    } catch (error) {
      //console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [onSearchResults, onClearSearch, saveSearchToHistory])

  // Debounced search
  const debouncedSearch = useCallback((query, filters) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query, filters)
    }, 300)
  }, [performSearch])

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value, searchFilters)
  }, [searchFilters, debouncedSearch])

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...searchFilters, [key]: value }
    setSearchFilters(newFilters)
    debouncedSearch(searchQuery, newFilters)
  }, [searchFilters, searchQuery, debouncedSearch])

  // Handle tag input
  const handleTagInputChange = useCallback((e) => {
    setTagInput(e.target.value)
  }, [])

  const handleTagInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim()
      if (tag && !searchFilters.tags.includes(tag)) {
        handleFilterChange('tags', [...searchFilters.tags, tag])
      }
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && searchFilters.tags.length > 0) {
      handleFilterChange('tags', searchFilters.tags.slice(0, -1))
    }
  }, [tagInput, searchFilters.tags, handleFilterChange])

  const removeTag = useCallback((tagToRemove) => {
    handleFilterChange('tags', searchFilters.tags.filter(tag => tag !== tagToRemove))
  }, [searchFilters.tags, handleFilterChange])

  // Check if filters are active
  const hasActiveFilters = useCallback((filters = searchFilters) => {
    return !!(
      filters.status ||
      filters.priority ||
      filters.dateRange ||
      filters.tags.length > 0 ||
      filters.hasDescription
    )
  }, [searchFilters])

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback((searchItem) => {
    setSearchQuery(searchItem.query)
    setSearchFilters(searchItem.filters)
    performSearch(searchItem.query, searchItem.filters)
    setIsExpanded(false)
  }, [performSearch])

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchFilters({
      status: '',
      priority: '',
      dateRange: '',
      customStartDate: '',
      customEndDate: '',
      tags: [],
      hasDescription: false
    })
    setTagInput('')
    setResults([])
    onClearSearch?.()
  }, [onClearSearch])

  // Clear search history
  const clearSearchHistory = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem('taskSearchHistory')
  }, [])

  return (
    <div className={`task-search ${className}`}>
      <div className="search-main">
        <div className="search-input-container">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="search-icon">
            <path
              d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 14L10.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="search-input"
          />

          {loading && <LoadingSpinner size="small" />}

          {(searchQuery || hasActiveFilters()) && (
            <button
              className="clear-search"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        <button
          className={`advanced-search-toggle ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="Toggle advanced search"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4H14M4 8H12M6 12H10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Advanced
          {hasActiveFilters() && <span className="active-indicator"></span>}
        </button>
      </div>

      {isExpanded && (
        <div className="advanced-search-panel">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={searchFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Any Status</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Priority</label>
              <select
                value={searchFilters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">Any Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Date Range</label>
              <select
                value={searchFilters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="">Any Date</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {searchFilters.dateRange === 'custom' && (
              <>
                <div className="filter-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={searchFilters.customStartDate}
                    onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={searchFilters.customEndDate}
                    onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="filter-group tags-filter">
            <label>Tags</label>
            <div className="tag-input-container">
              <div className="tag-list">
                {searchFilters.tags.map((tag, index) => (
                  <span key={index} className="tag-item">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tags..."
                  className="tag-input"
                />
              </div>
            </div>
          </div>

          <div className="filter-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={searchFilters.hasDescription}
                onChange={(e) => handleFilterChange('hasDescription', e.target.checked)}
              />
              Has Description
            </label>
          </div>

          {recentSearches.length > 0 && (
            <div className="recent-searches">
              <div className="recent-searches-header">
                <span>Recent Searches</span>
                <button onClick={clearSearchHistory} className="clear-history">
                  Clear History
                </button>
              </div>
              <div className="recent-searches-list">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    className="recent-search-item"
                    onClick={() => handleRecentSearchSelect(search)}
                  >
                    <span className="search-query">"{search.query}"</span>
                    <span className="search-time">
                      {new Date(search.timestamp).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskSearch