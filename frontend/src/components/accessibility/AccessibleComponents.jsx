import React, { useRef, useEffect, useState } from 'react'
import { AriaHelpers, KeyboardNavigation, FocusManager } from '../../utils/accessibility'

// Accessible Modal
export const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  closeOnEscape = true,
  closeOnOverlay = true 
}) => {
  const modalRef = useRef()
  const titleId = useRef(AriaHelpers.generateId('modal-title'))
  const descriptionId = useRef(AriaHelpers.generateId('modal-description'))
  const focusManager = useRef(new FocusManager())

  useEffect(() => {
    if (isOpen) {
      // Trap focus and save previous focus
      const cleanup = focusManager.current.trapFocus(modalRef.current)
      focusManager.current.pushFocus(modalRef.current)

      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      return () => {
        cleanup()
        document.body.style.overflow = 'unset'
        focusManager.current.popFocus()
      }
    }
  }, [isOpen])

  const handleKeyDown = (e) => {
    if (closeOnEscape) {
      KeyboardNavigation.handleEscape(e, onClose)
    }
  }

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`modal-overlay ${className}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId.current}
      aria-describedby={descriptionId.current}
    >
      <div
        ref={modalRef}
        className="modal-content"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id={titleId.current} className="modal-title">
            {title}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div id={descriptionId.current} className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

// Accessible Dropdown
export const AccessibleDropdown = ({ 
  trigger, 
  children, 
  className = '',
  placement = 'bottom-start' 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const triggerRef = useRef()
  const menuRef = useRef()
  const menuId = useRef(AriaHelpers.generateId('dropdown-menu'))

  const menuItems = React.Children.toArray(children).filter(
    child => child.type === AccessibleDropdownItem
  )

  const handleTriggerClick = () => {
    setIsOpen(!isOpen)
    setActiveIndex(-1)
  }

  const handleTriggerKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setIsOpen(true)
        setActiveIndex(0)
        break
      case 'ArrowUp':
        e.preventDefault()
        setIsOpen(true)
        setActiveIndex(menuItems.length - 1)
        break
      case 'Escape':
        setIsOpen(false)
        triggerRef.current.focus()
        break
    }
  }

  const handleMenuKeyDown = (e) => {
    const items = menuRef.current.querySelectorAll('[role="menuitem"]')
    
    KeyboardNavigation.handleArrowNavigation(
      e, 
      Array.from(items), 
      activeIndex, 
      setActiveIndex
    )

    if (e.key === 'Escape') {
      setIsOpen(false)
      triggerRef.current.focus()
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(e.target) &&
        menuRef.current && 
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`dropdown ${className}`}>
      <button
        ref={triggerRef}
        className="dropdown-trigger"
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId.current}
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId.current}
          className="dropdown-menu"
          role="menu"
          onKeyDown={handleMenuKeyDown}
        >
          {React.Children.map(children, (child, index) => {
            if (child.type === AccessibleDropdownItem) {
              return React.cloneElement(child, {
                isActive: index === activeIndex,
                onClick: () => {
                  child.props.onClick?.()
                  setIsOpen(false)
                }
              })
            }
            return child
          })}
        </div>
      )}
    </div>
  )
}

// Accessible Dropdown Item
export const AccessibleDropdownItem = ({ 
  children, 
  onClick, 
  isActive = false,
  disabled = false 
}) => {
  const itemRef = useRef()

  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.focus()
    }
  }, [isActive])

  const handleKeyDown = (e) => {
    KeyboardNavigation.handleActivation(e, onClick)
  }

  return (
    <div
      ref={itemRef}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      className={`dropdown-item ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      onKeyDown={disabled ? undefined : handleKeyDown}
      aria-disabled={disabled}
    >
      {children}
    </div>
  )
}

// Accessible Tabs
export const AccessibleTabs = ({ children, defaultTab = 0, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const tabListRef = useRef()
  const tabListId = useRef(AriaHelpers.generateId('tablist'))

  const tabs = React.Children.toArray(children).filter(
    child => child.type === AccessibleTab
  )

  const handleTabKeyDown = (e, index) => {
    const tabElements = tabListRef.current.querySelectorAll('[role="tab"]')
    
    KeyboardNavigation.handleArrowNavigation(
      e,
      Array.from(tabElements),
      index,
      setActiveTab
    )
  }

  return (
    <div className={`tabs ${className}`}>
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Tab navigation"
        className="tab-list"
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            role="tab"
            tabIndex={activeTab === index ? 0 : -1}
            aria-selected={activeTab === index}
            aria-controls={`tabpanel-${index}`}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
            onKeyDown={(e) => handleTabKeyDown(e, index)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      
      <div className="tab-panels">
        {tabs.map((tab, index) => (
          <div
            key={index}
            id={`tabpanel-${index}`}
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`tab-${index}`}
            className={`tab-panel ${activeTab === index ? 'active' : 'hidden'}`}
          >
            {activeTab === index && tab.props.children}
          </div>
        ))}
      </div>
    </div>
  )
}

// Accessible Tab
export const AccessibleTab = ({ label, children }) => {
  return <div>{children}</div>
}

// Accessible Alert
export const AccessibleAlert = ({ 
  type = 'info', 
  children, 
  onClose, 
  className = '',
  autoClose = false,
  autoCloseDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const alertRef = useRef()

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay, onClose])

  useEffect(() => {
    // Announce to screen readers
    if (alertRef.current && window.screenReader) {
      window.screenReader.announce(alertRef.current.textContent, type === 'error' ? 'assertive' : 'polite')
    }
  }, [type])

  if (!isVisible) return null

  const getAriaRole = () => {
    switch (type) {
      case 'error':
      case 'warning':
        return 'alert'
      default:
        return 'status'
    }
  }

  return (
    <div
      ref={alertRef}
      role={getAriaRole()}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`alert alert-${type} ${className}`}
    >
      <div className="alert-content">
        {children}
      </div>
      {onClose && (
        <button
          className="alert-close"
          onClick={() => {
            setIsVisible(false)
            onClose()
          }}
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  )
}

// Accessible Form Field
export const AccessibleFormField = ({ 
  label, 
  children, 
  error, 
  help, 
  required = false,
  className = '' 
}) => {
  const fieldId = useRef(AriaHelpers.generateId('field'))
  const errorId = useRef(AriaHelpers.generateId('error'))
  const helpId = useRef(AriaHelpers.generateId('help'))

  const getDescribedBy = () => {
    const ids = []
    if (error) ids.push(errorId.current)
    if (help) ids.push(helpId.current)
    return ids.length > 0 ? ids.join(' ') : undefined
  }

  return (
    <div className={`form-field ${className} ${error ? 'has-error' : ''}`}>
      <label htmlFor={fieldId.current} className="form-label">
        {label}
        {required && <span className="required" aria-label="required">*</span>}
      </label>
      
      {React.cloneElement(children, {
        id: fieldId.current,
        'aria-describedby': getDescribedBy(),
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required
      })}
      
      {help && (
        <div id={helpId.current} className="form-help">
          {help}
        </div>
      )}
      
      {error && (
        <div id={errorId.current} className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

export default {
  AccessibleModal,
  AccessibleDropdown,
  AccessibleDropdownItem,
  AccessibleTabs,
  AccessibleTab,
  AccessibleAlert,
  AccessibleFormField
}