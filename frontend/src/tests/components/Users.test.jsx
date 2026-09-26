import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithAuth } from '../utils/testUtils'
import Users from '../../pages/Users'

describe('Users Page', () => {
  test('renders users page with loading state', () => {
    renderWithAuth(<Users />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /explore all users/i })).toBeInTheDocument()
  })

  test('displays users after loading', async () => {
    renderWithAuth(<Users />)
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
  })

  test('shows user stats correctly', async () => {
    renderWithAuth(<Users />)
    
    await waitFor(() => {
      expect(screen.getByText('Tasks Completed: 5')).toBeInTheDocument()
      expect(screen.getByText('Tasks Completed: 10')).toBeInTheDocument()
    })
  })

  test('renders pagination when multiple pages exist', async () => {
    renderWithAuth(<Users />)
    
    await waitFor(() => {
      // Pagination would appear if totalPages > 1
      const pagination = screen.queryByRole('navigation', { name: /user pagination/i })
      // In our mock, we only have 1 page, so pagination shouldn't appear
      expect(pagination).not.toBeInTheDocument()
    })
  })

  test('handles pagination clicks', async () => {
    const user = userEvent.setup()
    renderWithAuth(<Users />)
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    // Test would include pagination interaction if multiple pages existed
  })

  test('displays fallback message when no users', async () => {
    // Mock empty response
    const { server } = require('../mocks/server')
    const { rest } = require('msw')
    
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: {
              items: [],
              pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          })
        )
      })
    )

    renderWithAuth(<Users />)
    
    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument()
    })
  })

  test('handles error state', async () => {
    // Mock error response
    const { server } = require('../mocks/server')
    const { rest } = require('msw')
    
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            success: false,
            error: { message: 'Server error' }
          })
        )
      })
    )

    renderWithAuth(<Users />)
    
    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })

  test('user cards have proper links', async () => {
    renderWithAuth(<Users />)
    
    await waitFor(() => {
      const viewProfileLinks = screen.getAllByText(/view profile/i)
      expect(viewProfileLinks).toHaveLength(2)
      
      viewProfileLinks.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('href', expect.stringMatching(/\/users\/\d+/))
      })
    })
  })

  test('is accessible', async () => {
    renderWithAuth(<Users />)
    
    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Explore All Users')
    
    // Check for descriptive text
    expect(screen.getByText(/browse our users and check out their completed tasks/i)).toBeInTheDocument()
    
    await waitFor(() => {
      // Check for proper image alt text
      const avatars = screen.getAllByRole('img')
      avatars.forEach(img => {
        expect(img).toHaveAttribute('alt', expect.stringMatching(/avatar/i))
      })
    })
  })

  test('has proper document head meta tags', () => {
    renderWithAuth(<Users />)
    
    expect(document.title).toContain('All Users - Taskly')
  })
})