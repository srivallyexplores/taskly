import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import authService from '../services/authService'
import userService from '../services/userService'
import teamService from '../services/teamService'
import projectService from '../services/projectService'

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false, // Set to false initially to prevent blocking
  error: null,
  backendAvailable: true,
  userTeams: [],
  userProjects: [],
  teamPermissions: {},
  projectPermissions: {}
}

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  SET_BACKEND_UNAVAILABLE: 'SET_BACKEND_UNAVAILABLE',
  UPDATE_USER_TEAMS: 'UPDATE_USER_TEAMS',
  UPDATE_USER_PROJECTS: 'UPDATE_USER_PROJECTS',
  UPDATE_TEAM_PERMISSIONS: 'UPDATE_TEAM_PERMISSIONS',
  UPDATE_PROJECT_PERMISSIONS: 'UPDATE_PROJECT_PERMISSIONS'
}

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      }

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        userTeams: [],
        userProjects: [],
        teamPermissions: {},
        projectPermissions: {}
      }

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      }

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      }

    case AUTH_ACTIONS.SET_BACKEND_UNAVAILABLE:
      return {
        ...state,
        backendAvailable: false,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: 'Backend server is not available',
        userTeams: [],
        userProjects: [],
        teamPermissions: {},
        projectPermissions: {}
      }

    case AUTH_ACTIONS.UPDATE_USER_TEAMS:
      return {
        ...state,
        userTeams: action.payload
      }

    case AUTH_ACTIONS.UPDATE_USER_PROJECTS:
      return {
        ...state,
        userProjects: action.payload
      }

    case AUTH_ACTIONS.UPDATE_TEAM_PERMISSIONS:
      return {
        ...state,
        teamPermissions: {
          ...state.teamPermissions,
          [action.payload.teamId]: action.payload.permissions
        }
      }

    case AUTH_ACTIONS.UPDATE_PROJECT_PERMISSIONS:
      return {
        ...state,
        projectPermissions: {
          ...state.projectPermissions,
          [action.payload.projectId]: action.payload.permissions
        }
      }

    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Load user on app start - only when needed
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      if (!isMounted) return

      // Only check authentication if we have stored user data or are on a protected route
      const hasStoredUser = authService.hasStoredUser()
      const currentPath = window.location.pathname
      const publicPaths = ['/', '/about', '/login', '/signup', '/users']
      const isPublicRoute = publicPaths.includes(currentPath) || currentPath.startsWith('/users/')
      
      if (!hasStoredUser && isPublicRoute) {
        // No stored user and on public route, mark as not authenticated without API call
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER_FAILURE,
          payload: 'No stored user data'
        })
        return
      }

      // Only try to authenticate if we have stored user data or are on a protected route
      if (hasStoredUser || !isPublicRoute) {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_START })

        try {
          // Try to get user data from API (session-based)
          const currentUser = await authService.getCurrentUser()
          if (isMounted) {
            if (currentUser) {
              dispatch({
                type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
                payload: currentUser
              })
            } else {
              dispatch({
                type: AUTH_ACTIONS.LOAD_USER_FAILURE,
                payload: 'No active session'
              })
            }
          }
        } catch (error) {
          if (isMounted) {
            // Clear any stale data and mark as not authenticated
            authService.clearAuthData()
            
            // Check if it's a backend unavailable error
            if (error.code === 'BACKEND_UNAVAILABLE') {
              dispatch({
                type: AUTH_ACTIONS.SET_BACKEND_UNAVAILABLE
              })
            } else {
              dispatch({
                type: AUTH_ACTIONS.LOAD_USER_FAILURE,
                payload: 'User not authenticated'
              })
            }
          }
        }
      } else {
        // On public route without stored user, just mark as not authenticated
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER_FAILURE,
          payload: 'No authentication needed for public route'
        })
      }
    }

    // Add a small delay to prevent rapid re-calls in development
    const timeoutId = setTimeout(initializeAuth, 100)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  // Load user from session or API
  const loadUser = useCallback(async () => {
    dispatch({ type: AUTH_ACTIONS.LOAD_USER_START })

    try {
      // Try to get user data from API (session-based)
      const currentUser = await authService.getCurrentUser()
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
        payload: currentUser
      })
    } catch (error) {
      // Clear any stale data and mark as not authenticated
      authService.clearAuthData()
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER_FAILURE,
        payload: 'User not authenticated'
      })
    }
  }, [dispatch])

  // Login function
  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })

    try {
      const response = await authService.login(credentials)
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.user
          }
        })
        return response
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      })
      throw error
    }
  }, [dispatch])

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START })

    try {
      const response = await authService.register(userData)
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: {
            user: response.data.user
          }
        })
        return response
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message
      })
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      //console.warn('Logout API call failed:', error.message)
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }

  // Update user function (local-only optimistic state update)
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    })
  }

  // Persist profile changes to the backend and update state from the server response
  const updateProfile = useCallback(async (profileData) => {
    const response = await userService.updateProfile(profileData)

    // Backend returns { success, data: { user }, message }
    const updatedUser = response?.data?.user
    if (response?.success && updatedUser) {
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser
      })
      // Keep the cached user in sync so a refresh restores the latest data
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser))
      } catch (e) {
        // Ignore storage errors (e.g. private mode)
      }
      return updatedUser
    }

    throw new Error(response?.message || 'Failed to update profile')
  }, [dispatch])

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }, [dispatch])

  // Set loading function
  const setLoading = (loading) => {
    dispatch({
      type: AUTH_ACTIONS.SET_LOADING,
      payload: loading
    })
  }

  // Refresh user data
  const refreshUser = async () => {
    if (state.isAuthenticated) {
      try {
        const currentUser = await authService.getCurrentUser()
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: currentUser
        })
        
        // Also refresh user's teams and projects
        await refreshUserTeamsAndProjects()
        
        return currentUser
      } catch (error) {
        //console.error('Failed to refresh user data:', error)
        // If refresh fails due to invalid session, logout
        if (error.status === 401) {
          logout()
        }
        throw error
      }
    }
  }

  // Refresh user's teams and projects
  const refreshUserTeamsAndProjects = async () => {
    if (!state.isAuthenticated || !state.user) return

    try {
      // Fetch user's teams and projects from the real backend routes
      // (GET /teams and GET /projects). These services never throw; they
      // return { success, data } so a failure cannot break auth bootstrap.
      const [teamsResponse, projectsResponse] = await Promise.all([
        teamService.getTeams(),
        projectService.getProjects()
      ])

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER_TEAMS,
        payload: teamsResponse.data || []
      })

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER_PROJECTS,
        payload: projectsResponse.data || []
      })

      // Update permissions for each team and project
      const teams = teamsResponse.data || []
      const projects = projectsResponse.data || []

      for (const team of teams) {
        const member = team.members?.find(m => m.user._id === state.user._id)
        if (member) {
          dispatch({
            type: AUTH_ACTIONS.UPDATE_TEAM_PERMISSIONS,
            payload: {
              teamId: team._id,
              permissions: {
                role: member.role,
                canManage: ['owner', 'admin'].includes(member.role),
                canInvite: ['owner', 'admin'].includes(member.role),
                canEdit: ['owner', 'admin'].includes(member.role)
              }
            }
          })
        }
      }

      for (const project of projects) {
        const member = project.members?.find(m => m.user._id === state.user._id)
        if (member) {
          dispatch({
            type: AUTH_ACTIONS.UPDATE_PROJECT_PERMISSIONS,
            payload: {
              projectId: project._id,
              permissions: {
                role: member.role,
                canManage: ['owner', 'admin'].includes(member.role),
                canAssign: ['owner', 'admin'].includes(member.role),
                canEdit: ['owner', 'admin'].includes(member.role)
              }
            }
          })
        }
      }
    } catch (error) {
      //console.error('Failed to refresh user teams and projects:', error)
    }
  }

  // Check if user has permission for a team action
  const hasTeamPermission = useCallback((teamId, permission) => {
    if (!state.isAuthenticated || !teamId) return false
    
    const teamPerms = state.teamPermissions[teamId]
    if (!teamPerms) return false

    switch (permission) {
      case 'manage':
      case 'edit':
        return teamPerms.canManage || teamPerms.canEdit
      case 'invite':
        return teamPerms.canInvite
      case 'view':
        return true // If user has team permissions, they can view
      default:
        return false
    }
  }, [state.isAuthenticated, state.teamPermissions])

  // Check if user has permission for a project action
  const hasProjectPermission = useCallback((projectId, permission) => {
    if (!state.isAuthenticated || !projectId) return false
    
    const projectPerms = state.projectPermissions[projectId]
    if (!projectPerms) return false

    switch (permission) {
      case 'manage':
      case 'edit':
        return projectPerms.canManage || projectPerms.canEdit
      case 'assign':
        return projectPerms.canAssign
      case 'view':
        return true // If user has project permissions, they can view
      default:
        return false
    }
  }, [state.isAuthenticated, state.projectPermissions])

  // Get user's role in a team
  const getUserTeamRole = useCallback((teamId) => {
    if (!state.isAuthenticated || !teamId) return null
    
    const teamPerms = state.teamPermissions[teamId]
    return teamPerms?.role || null
  }, [state.isAuthenticated, state.teamPermissions])

  // Get user's role in a project
  const getUserProjectRole = useCallback((projectId) => {
    if (!state.isAuthenticated || !projectId) return null
    
    const projectPerms = state.projectPermissions[projectId]
    return projectPerms?.role || null
  }, [state.isAuthenticated, state.projectPermissions])

  // Update team membership (called when user joins/leaves teams)
  const updateTeamMembership = useCallback((teamId, membership) => {
    if (membership) {
      // User joined team
      dispatch({
        type: AUTH_ACTIONS.UPDATE_TEAM_PERMISSIONS,
        payload: {
          teamId,
          permissions: {
            role: membership.role,
            canManage: ['owner', 'admin'].includes(membership.role),
            canInvite: ['owner', 'admin'].includes(membership.role),
            canEdit: ['owner', 'admin'].includes(membership.role)
          }
        }
      })
    } else {
      // User left team - remove permissions
      const newPermissions = { ...state.teamPermissions }
      delete newPermissions[teamId]
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_TEAM_PERMISSIONS,
        payload: newPermissions
      })
    }
  }, [state.teamPermissions])

  // Update project membership (called when user joins/leaves projects)
  const updateProjectMembership = useCallback((projectId, membership) => {
    if (membership) {
      // User joined project
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROJECT_PERMISSIONS,
        payload: {
          projectId,
          permissions: {
            role: membership.role,
            canManage: ['owner', 'admin'].includes(membership.role),
            canAssign: ['owner', 'admin'].includes(membership.role),
            canEdit: ['owner', 'admin'].includes(membership.role)
          }
        }
      })
    } else {
      // User left project - remove permissions
      const newPermissions = { ...state.projectPermissions }
      delete newPermissions[projectId]
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROJECT_PERMISSIONS,
        payload: newPermissions
      })
    }
  }, [state.projectPermissions])

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    backendAvailable: state.backendAvailable,
    userTeams: state.userTeams,
    userProjects: state.userProjects,
    teamPermissions: state.teamPermissions,
    projectPermissions: state.projectPermissions,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    clearError,
    setLoading,
    refreshUser,
    loadUser,
    refreshUserTeamsAndProjects,
    
    // Team/Project permissions
    hasTeamPermission,
    hasProjectPermission,
    getUserTeamRole,
    getUserProjectRole,
    updateTeamMembership,
    updateProjectMembership
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export default AuthContext