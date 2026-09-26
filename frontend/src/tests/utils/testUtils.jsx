// Test utilities
import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import { NotificationProvider } from '../../context/NotificationContext'
import { ErrorProvider } from '../../context/ErrorContext'

// Mock user for testing
export const mockUser = {
  _id: '1',
  username: 'testuser',
  fullname: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg'
}

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialEntries = ['/'],
    user = null,
    ...renderOptions
  } = options

  // Mock auth context value
  const mockAuthValue = {
    user,
    isAuthenticated: !!user,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn(),
    updateUser: jest.fn()
  }

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <ErrorProvider>
        <NotificationProvider>
          <AuthProvider value={mockAuthValue}>
            {children}
          </AuthProvider>
        </NotificationProvider>
      </ErrorProvider>
    </BrowserRouter>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Render with authenticated user
export const renderWithAuth = (ui, options = {}) => {
  return renderWithProviders(ui, {
    user: mockUser,
    ...options
  })
}

// Render with router only
export const renderWithRouter = (ui, options = {}) => {
  const { initialEntries = ['/'] } = options

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )

  return render(ui, { wrapper: Wrapper })
}

// Mock intersection observer
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.IntersectionObserver = mockIntersectionObserver
}

// Mock resize observer
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn()
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.ResizeObserver = mockResizeObserver
}

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock API responses
export const mockApiResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data))
})

// Mock fetch
export const mockFetch = (response) => {
  global.fetch = jest.fn(() => Promise.resolve(response))
}

// Create mock event
export const createMockEvent = (type, properties = {}) => ({
  type,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...properties
})

// Mock local storage
export const mockLocalStorage = () => {
  const store = {}
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value
    }),
    removeItem: jest.fn(key => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    })
  }
}

// Mock console methods
export const mockConsole = () => {
  const originalConsole = { ...console }
  
  beforeEach(() => {
    //console.log = jest.fn()
    //console.warn = jest.fn()
    //console.error = jest.fn()
  })

  afterEach(() => {
    Object.assign(console, originalConsole)
  })
}

// Custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received && document.body.contains(received)
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass
    }
  },

  toHaveAccessibleName(received, expectedName) {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') ||
                          received.textContent
    const pass = accessibleName === expectedName
    return {
      message: () => `expected element to have accessible name "${expectedName}" but got "${accessibleName}"`,
      pass
    }
  }
})

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'