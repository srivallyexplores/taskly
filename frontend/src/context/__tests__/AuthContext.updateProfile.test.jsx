import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

// Mock the services that AuthContext depends on
vi.mock('../../services/userService', () => ({
  default: {
    updateProfile: vi.fn()
  }
}))
vi.mock('../../services/authService', () => ({
  default: {
    hasStoredUser: vi.fn(() => false),
    getCurrentUser: vi.fn(),
    clearAuthData: vi.fn()
  }
}))
vi.mock('../../services/teamService', () => ({
  default: { getTeams: vi.fn(() => Promise.resolve({ success: true, data: [] })) }
}))
vi.mock('../../services/projectService', () => ({
  default: { getProjects: vi.fn(() => Promise.resolve({ success: true, data: [] })) }
}))

import { AuthProvider, useAuth } from '../AuthContext'
import userService from '../../services/userService'

// Test harness that exposes updateProfile and the current user
let capturedAuth
const Harness = () => {
  capturedAuth = useAuth()
  return <div data-testid="fullname">{capturedAuth.user?.fullname || 'none'}</div>
}

describe('AuthContext.updateProfile (FEAT-003)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    capturedAuth = undefined
  })

  it('calls userService.updateProfile and updates state from the server response', async () => {
    userService.updateProfile.mockResolvedValue({
      success: true,
      data: { user: { _id: '1', fullname: 'Server Name', jobTitle: 'Dev' } },
      message: 'Profile updated successfully'
    })

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    )

    let returned
    await act(async () => {
      returned = await capturedAuth.updateProfile({ fullname: 'Typed Name' })
    })

    // The service was called with the caller's payload
    expect(userService.updateProfile).toHaveBeenCalledWith({ fullname: 'Typed Name' })
    // State was updated from the SERVER response, not the local payload
    expect(returned.fullname).toBe('Server Name')
    expect(screen.getByTestId('fullname').textContent).toBe('Server Name')
    // Cached user is kept in sync
    expect(JSON.parse(localStorage.getItem('user')).fullname).toBe('Server Name')
  })

  it('throws when the backend reports failure', async () => {
    userService.updateProfile.mockResolvedValue({ success: false, message: 'Nope' })

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    )

    await expect(
      act(async () => {
        await capturedAuth.updateProfile({ fullname: 'X' })
      })
    ).rejects.toThrow('Nope')
  })
})
