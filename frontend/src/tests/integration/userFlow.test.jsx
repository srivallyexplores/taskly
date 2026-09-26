import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/testUtils'
import App from '../../App'

describe('User Flow Integration Tests', () => {
  test('complete user registration and task creation flow', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)

    // Start at home page
    expect(screen.getByText(/taskly/i)).toBeInTheDocument()

    // Navigate to signup
    const signupLink = screen.getByRole('link', { name: /sign up/i })
    await user.click(signupLink)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument()
    })

    // Fill out signup form
    const fullnameInput = screen.getByLabelText(/full name/i)
    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(fullnameInput, 'Test User')
    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Submit signup form
    const signupButton = screen.getByRole('button', { name: /sign up/i })
    await user.click(signupButton)

    // Should redirect to dashboard after successful signup
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })

    // Navigate to create task
    const addTaskButton = screen.getByRole('button', { name: /add task/i })
    await user.click(addTaskButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add new task/i })).toBeInTheDocument()
    })

    // Fill out task form
    const titleInput = screen.getByLabelText(/task title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const dueDateInput = screen.getByLabelText(/due date/i)

    await user.type(titleInput, 'Test Task')
    await user.type(descriptionInput, 'This is a test task')
    await user.type(dueDateInput, '2024-12-31')

    // Select priority
    const highPriorityRadio = screen.getByLabelText(/high/i)
    await user.click(highPriorityRadio)

    // Submit task form
    const createTaskButton = screen.getByRole('button', { name: /add task/i })
    await user.click(createTaskButton)

    // Should redirect back to task list
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })
  })

  test('user authentication flow', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)

    // Try to access protected route
    const usersLink = screen.getByRole('link', { name: /users/i })
    await user.click(usersLink)

    // Should redirect to login
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    })

    // Fill out login form
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Submit login form
    const loginButton = screen.getByRole('button', { name: /login/i })
    await user.click(loginButton)

    // Should redirect to users page after successful login
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /explore all users/i })).toBeInTheDocument()
    })

    // Logout
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    // Should redirect to home page
    await waitFor(() => {
      expect(screen.getByText(/taskly/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })
  })

  test('task management flow', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />, { user: { _id: '1', username: 'testuser' } })

    // Navigate to tasks
    const tasksLink = screen.getByRole('link', { name: /tasks/i })
    await user.click(tasksLink)

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Edit task
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument()
    })

    // Update task title
    const titleInput = screen.getByDisplayValue('Test Task')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Test Task')

    // Save changes
    const saveButton = screen.getByRole('button', { name: /update changes/i })
    await user.click(saveButton)

    // Should return to task list with updated task
    await waitFor(() => {
      expect(screen.getByText('Updated Test Task')).toBeInTheDocument()
    })

    // Complete task
    const completeButton = screen.getByRole('button', { name: /done/i })
    await user.click(completeButton)

    await waitFor(() => {
      expect(screen.getByText(/completed/i)).toBeInTheDocument()
    })
  })

  test('responsive navigation flow', async () => {
    const user = userEvent.setup()
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    renderWithProviders(<App />)

    // Mobile menu should be collapsed initially
    const mobileMenuButton = screen.getByRole('button', { name: /toggle navigation/i })
    expect(mobileMenuButton).toBeInTheDocument()

    // Open mobile menu
    await user.click(mobileMenuButton)

    // Navigation items should be visible
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /home/i })).toBeVisible()
      expect(screen.getByRole('link', { name: /about/i })).toBeVisible()
    })

    // Navigate to about page
    const aboutLink = screen.getByRole('link', { name: /about/i })
    await user.click(aboutLink)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument()
    })
  })

  test('error handling flow', async () => {
    const user = userEvent.setup()
    
    // Mock network error
    const { server } = require('../mocks/server')
    const { rest } = require('msw')
    
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    renderWithProviders(<App />, { user: { _id: '1', username: 'testuser' } })

    // Navigate to users page
    const usersLink = screen.getByRole('link', { name: /users/i })
    await user.click(usersLink)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })

    // Should have retry button
    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()

    // Reset server to normal behavior
    server.resetHandlers()

    // Retry should work
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })
})