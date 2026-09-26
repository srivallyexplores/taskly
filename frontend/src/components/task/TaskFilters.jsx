import React, { useState, useCallback } from 'react'

const TaskFilters = ({
  filters,
  onFilterChange,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
  sortBy,
  sortOrder,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search || '')

  // Handle search input with debouncing
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearchInput(value)
    
    // Debounce search input
    const timeoutId = setTimeout(() => {
      onFilterChange('search', value)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [onFilterChange])

  const handleStatusChange = useCallback((e) => {
    onFilterChange('status', e.target.value)
  }, [onFilterChange])

  const handlePriorityChange = useCallback((e) => {
    onFilterChange('priority', e.target.value)
  }, [onFilterChange])

  const handleSortByChange = useCallback((e) => {
    const newSortBy = e.target.value
    onSortChange(newSortBy, sortOrder)
  }, [onSortChange, sortOrder])

  const handleSortOrderChange = useCallback((e) => {
    const newSortOrder = e.target.value
    onSortChange(sortBy, newSortOrder)
  }, [onSortChange, sortBy])

  const handleReset = useCallback(() => {
    setSearchInput('')
    onResetFilters()
  }, [onResetFilters])

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  return (
    <div className={`task-filters ${className}`}>
      <div className="filters-header">
        <div className="search-section">
          <div className="search-input-wrapper">
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
              type="text"
              placeholder="Search tasks..."
              value={searchInput}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchInput && (
              <button
                className="clear-search"
                onClick={() => {
                  setSearchInput('')
                  onFilterChange('search', '')
                }}
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
        </div>

        <div className="filter-controls">
          <button
            className={`filter-toggle ${isExpanded ? 'expanded' : ''}`}
            onClick={toggleExpanded}
            aria-label="Toggle filters"
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
            Filters
            {hasActiveFilters && <span className="active-indicator"></span>}
          </button>

          {hasActiveFilters && (
            <button
              className="reset-filters"
              onClick={handleReset}
              aria-label="Reset all filters"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={filters.status || ''}
                onChange={handleStatusChange}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="priority-filter">Priority</label>
              <select
                id="priority-filter"
                value={filters.priority || ''}
                onChange={handlePriorityChange}
                className="filter-select"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sort-by">Sort By</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={handleSortByChange}
                className="filter-select"
              >
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="due">Due Date</option>
                <option value="title">Title</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sort-order">Order</label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={handleSortOrderChange}
                className="filter-select"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="filter-summary">
            {hasActiveFilters ? (
              <div className="active-filters">
                <span className="filter-label">Active filters:</span>
                {filters.status && (
                  <span className="filter-tag">
                    Status: {filters.status}
                    <button onClick={() => onFilterChange('status', '')}>×</button>
                  </span>
                )}
                {filters.priority && (
                  <span className="filter-tag">
                    Priority: {filters.priority}
                    <button onClick={() => onFilterChange('priority', '')}>×</button>
                  </span>
                )}
                {filters.search && (
                  <span className="filter-tag">
                    Search: "{filters.search}"
                    <button onClick={() => {
                      setSearchInput('')
                      onFilterChange('search', '')
                    }}>×</button>
                  </span>
                )}
              </div>
            ) : (
              <span className="no-filters">No active filters</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskFilters