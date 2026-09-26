// MSW server for API mocking
import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Mock data
const mockUsers = [
  {
    _id: '1',
    username: 'testuser',
    fullname: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    stats: {
      completed: 5,
      failed: 1,
      completionRate: 83
    }
  },
  {
    _id: '2',
    username: 'jane',
    fullname: 'Jane Doe',
    email: 'jane@example.com',
    avatar: 'https://example.com/jane.jpg',
    stats: {
      completed: 10,
      failed: 0,
      completionRate: 100
    }
  }
]

const mockTasks = [
  {
    _id: '1',
    title: 'Test Task',
    description: 'This is a test task',
    due: '2024-12-31',
    priority: 'high',
    status: 'in-progress',
    tags: ['work', 'urgent'],
    user: '1'
  },
  {
    _id: '2',
    title: 'Completed Task',
    description: 'This task is done',
    due: '2024-12-25',
    priority: 'medium',
    status: 'completed',
    tags: ['personal'],
    user: '1'
  }
]

// API handlers
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: mockUsers[0],
          token: 'mock-jwt-token'
        }
      })
    )
  }),

  rest.post('/api/auth/signup', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          user: mockUsers[0],
          token: 'mock-jwt-token'
        }
      })
    )
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Logged out successfully'
      })
    )
  }),

  // User endpoints
  rest.get('/api/users', (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || 1
    const limit = req.url.searchParams.get('limit') || 10
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: mockUsers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: 1,
            totalItems: mockUsers.length,
            hasNextPage: false,
            hasPreviousPage: false
          }
        }
      })
    )
  }),

  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params
    const user = mockUsers.find(u => u._id === id)
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: { message: 'User not found' }
        })
      )
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: user
      })
    )
  }),

  rest.put('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params
    const user = mockUsers.find(u => u._id === id)
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: { message: 'User not found' }
        })
      )
    }

    const updatedUser = { ...user, ...req.body }
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: updatedUser
      })
    )
  }),

  // Task endpoints
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: mockTasks,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: mockTasks.length,
            hasNextPage: false,
            hasPreviousPage: false
          }
        }
      })
    )
  }),

  rest.get('/api/users/:userId/tasks', (req, res, ctx) => {
    const { userId } = req.params
    const userTasks = mockTasks.filter(task => task.user === userId)
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: userTasks,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: userTasks.length,
            hasNextPage: false,
            hasPreviousPage: false
          }
        }
      })
    )
  }),

  rest.get('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params
    const task = mockTasks.find(t => t._id === id)
    
    if (!task) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: { message: 'Task not found' }
        })
      )
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: task
      })
    )
  }),

  rest.post('/api/tasks', (req, res, ctx) => {
    const newTask = {
      _id: Date.now().toString(),
      ...req.body,
      status: 'in-progress'
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: newTask
      })
    )
  }),

  rest.put('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params
    const task = mockTasks.find(t => t._id === id)
    
    if (!task) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: { message: 'Task not found' }
        })
      )
    }

    const updatedTask = { ...task, ...req.body }
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: updatedTask
      })
    )
  }),

  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params
    const taskIndex = mockTasks.findIndex(t => t._id === id)
    
    if (taskIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: { message: 'Task not found' }
        })
      )
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Task deleted successfully'
      })
    )
  }),

  // Stats endpoints
  rest.get('/api/users/:id/stats', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          completed: 5,
          failed: 1,
          ongoing: 3,
          completionRate: 83,
          streak: 7,
          avgTime: '2.5 hrs'
        }
      })
    )
  })
]

// Create server
export const server = setupServer(...handlers)