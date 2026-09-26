# Taskly API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.yourdomain.com/api
```

## Authentication

Taskly uses session-based authentication with cookies. After logging in, the session cookie is automatically included in subsequent requests.

### Headers
```
Content-Type: application/json
```

### Session Cookie
The session cookie is automatically managed by the browser. Ensure `withCredentials: true` is set in your HTTP client.

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": [] // Optional validation errors
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "fullname": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "avatar": "https://example.com/avatar.jpg" // Optional
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "fullname": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User registered successfully"
}
```

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "johndoe", // or email
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "fullname": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "message": "Login successful"
}
```

### Get Current User
```http
GET /auth/me
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "fullname": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Software developer",
    "jobTitle": "Senior Developer",
    "company": "Tech Corp"
  }
}
```

### Logout User
```http
POST /auth/logout
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## User Endpoints

### Get All Users
```http
GET /users?page=1&limit=12&search=john
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page
- `search` (string, optional) - Search by name, username, or email

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "fullname": "John Doe",
        "username": "johndoe",
        "email": "john@example.com",
        "avatar": "https://example.com/avatar.jpg"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNextPage": true,
      "hasPreviousPage": false,
      "perPage": 12
    }
  }
}
```

### Get User by ID
```http
GET /users/:userId
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "fullname": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Software developer",
    "jobTitle": "Senior Developer",
    "company": "Tech Corp",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User Profile
```http
PUT /users/profile
```

**Request Body:**
```json
{
  "fullname": "John Updated",
  "bio": "Senior Software Developer",
  "jobTitle": "Lead Developer",
  "company": "Tech Corp",
  "timezone": "America/New_York"
}
```

**Response:** `200 OK`

### Change Password
```http
PUT /users/profile/password
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response:** `200 OK`

### Upload Avatar
```http
PUT /users/profile/avatar
```

**Request Body:**
```json
{
  "avatar": "https://cloudinary.com/image.jpg"
}
```

**Response:** `200 OK`

---

## Task Endpoints

### Get All Tasks
```http
GET /tasks?page=1&limit=10&status=in-progress&priority=high&search=urgent
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string, optional) - Filter by status: `in-progress`, `completed`, `failed`
- `priority` (string, optional) - Filter by priority: `low`, `medium`, `high`
- `search` (string, optional) - Search in title, description, tags
- `sortBy` (string, default: 'createdAt') - Sort field
- `sortOrder` (string, default: 'desc') - Sort order: `asc`, `desc`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "task_id",
        "title": "Complete project",
        "description": "Finish the project by end of month",
        "due": "2024-12-31T00:00:00.000Z",
        "priority": "high",
        "status": "in-progress",
        "tags": ["work", "urgent"],
        "labels": ["feature"],
        "user": {
          "_id": "user_id",
          "fullname": "John Doe",
          "username": "johndoe"
        },
        "assignee": {
          "_id": "assignee_id",
          "fullname": "Jane Smith",
          "username": "janesmith"
        },
        "project": {
          "_id": "project_id",
          "name": "Website Redesign"
        },
        "team": {
          "_id": "team_id",
          "name": "Development Team"
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-02T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "hasNextPage": true,
      "hasPreviousPage": false,
      "perPage": 10
    }
  }
}
```

### Create Task
```http
POST /tasks
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "due": "2024-12-31T00:00:00.000Z",
  "priority": "high",
  "tags": ["work", "urgent"],
  "labels": ["feature"],
  "assignee": "user_id", // Optional - assign to team member
  "projectId": "project_id", // Optional - associate with project
  "teamId": "team_id" // Optional - associate with team
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "task_id",
    "title": "New Task",
    "description": "Task description",
    "due": "2024-12-31T00:00:00.000Z",
    "priority": "high",
    "status": "in-progress",
    "tags": ["work", "urgent"],
    "labels": ["feature"],
    "user": {
      "_id": "user_id",
      "fullname": "John Doe"
    },
    "assignee": {
      "_id": "assignee_id",
      "fullname": "Jane Smith"
    },
    "project": {
      "_id": "project_id",
      "name": "Website Redesign"
    },
    "team": {
      "_id": "team_id",
      "name": "Development Team"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Task created successfully"
}
```

### Get Task by ID
```http
GET /tasks/:taskId
```

**Response:** `200 OK`

### Update Task
```http
PUT /tasks/:taskId
```

**Request Body:**
```json
{
  "title": "Updated Task",
  "description": "Updated description",
  "priority": "medium",
  "status": "completed",
  "assignee": "new_assignee_id"
}
```

**Response:** `200 OK`

### Update Task Status
```http
PATCH /tasks/:taskId/status
```

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response:** `200 OK`

### Delete Task
```http
DELETE /tasks/:taskId
```

**Response:** `200 OK`

---

## Team Endpoints

### Get All Teams
```http
GET /teams
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "team_id",
      "name": "Development Team",
      "description": "Main development team",
      "owner": {
        "_id": "user_id",
        "fullname": "John Doe"
      },
      "members": [
        {
          "user": {
            "_id": "user_id",
            "fullname": "John Doe",
            "avatar": "https://example.com/avatar.jpg"
          },
          "role": "owner",
          "joinedAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "memberCount": 5,
      "projectCount": 3,
      "isPrivate": false,
      "inviteCode": "ABC123",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Team
```http
POST /teams
```

**Request Body:**
```json
{
  "name": "New Team",
  "description": "Team description",
  "isPrivate": false
}
```

**Response:** `201 Created`

### Get Team by ID
```http
GET /teams/:teamId
```

**Response:** `200 OK`

### Update Team
```http
PUT /teams/:teamId
```

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "Updated description",
  "isPrivate": true
}
```

**Response:** `200 OK`

### Delete Team
```http
DELETE /teams/:teamId
```

**Response:** `200 OK`

### Invite Team Member
```http
POST /teams/:teamId/invite
```

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Response:** `201 Created`

### Update Member Role
```http
PUT /teams/:teamId/members/:userId
```

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:** `200 OK`

### Remove Team Member
```http
DELETE /teams/:teamId/members/:userId
```

**Response:** `200 OK`

### Get Team Statistics
```http
GET /teams/:teamId/stats
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "teamId": "team_id",
    "stats": {
      "totalMembers": 5,
      "totalProjects": 3,
      "totalTasks": 45,
      "completedTasks": 30,
      "inProgressTasks": 12,
      "failedTasks": 3,
      "completionRate": 66.67
    }
  }
}
```

---

## Project Endpoints

### Get All Projects
```http
GET /projects?teamId=team_id&status=active&priority=high
```

**Query Parameters:**
- `teamId` (string, optional) - Filter by team
- `status` (string, optional) - Filter by status
- `priority` (string, optional) - Filter by priority

**Response:** `200 OK`

### Create Project
```http
POST /projects
```

**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Complete website redesign project",
  "teamId": "team_id",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "priority": "high",
  "status": "active"
}
```

**Response:** `201 Created`

### Get Project by ID
```http
GET /projects/:projectId
```

**Response:** `200 OK`

### Update Project
```http
PUT /projects/:projectId
```

**Response:** `200 OK`

### Delete Project
```http
DELETE /projects/:projectId
```

**Response:** `200 OK`

### Get Project Statistics
```http
GET /projects/:projectId/stats
```

**Response:** `200 OK`

---

## Invitation Endpoints

### Get User Invitations
```http
GET /users/invitations
```

**Response:** `200 OK`

### Accept Invitation
```http
POST /invitations/:invitationId/accept
```

**Response:** `200 OK`

### Deny Invitation
```http
POST /invitations/:invitationId/deny
```

**Response:** `200 OK`

### Cancel Invitation
```http
DELETE /invitations/:invitationId
```

**Response:** `200 OK`

---

## Notification Endpoints

### Get Notifications
```http
GET /notifications?page=1&limit=20&unreadOnly=true
```

**Response:** `200 OK`

### Mark as Read
```http
PATCH /notifications/:notificationId/read
```

**Response:** `200 OK`

### Delete Notification
```http
DELETE /notifications/:notificationId
```

**Response:** `200 OK`

---

## Search Endpoints

### Search Users
```http
GET /search/users?q=john&limit=10
```

**Response:** `200 OK`

### Search Team Users
```http
GET /teams/:teamId/search-users?q=jane
```

**Response:** `200 OK`

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `USER_NOT_FOUND` | User does not exist |
| `TASK_NOT_FOUND` | Task does not exist |
| `TEAM_NOT_FOUND` | Team does not exist |
| `PROJECT_NOT_FOUND` | Project does not exist |
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Insufficient permissions |
| `DUPLICATE_USERNAME` | Username already exists |
| `DUPLICATE_EMAIL` | Email already exists |
| `INVALID_CREDENTIALS` | Invalid username/password |
| `TEAM_FULL` | Team has reached maximum members |
| `ALREADY_MEMBER` | User is already a team member |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General endpoints**: 100 requests per 15 minutes per IP

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

---

## Pagination

List endpoints support pagination with the following query parameters:

- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page

Pagination response includes:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "perPage": 10
  }
}
```

---

## Filtering and Sorting

Many list endpoints support filtering and sorting:

**Filtering:**
- Use query parameters matching field names
- Example: `?status=completed&priority=high`

**Sorting:**
- `sortBy` - Field to sort by
- `sortOrder` - `asc` or `desc`
- Example: `?sortBy=createdAt&sortOrder=desc`

---

## Best Practices

1. **Always handle errors**: Check `success` field in response
2. **Use pagination**: Don't fetch all items at once
3. **Implement retry logic**: For network failures
4. **Cache responses**: When appropriate
5. **Use HTTPS**: In production
6. **Validate input**: Before sending requests
7. **Handle rate limits**: Implement exponential backoff

---

## Examples

### JavaScript (Axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

// Login
const login = async () => {
  const response = await api.post('/auth/login', {
    username: 'johndoe',
    password: 'password123'
  });
  return response.data;
};

// Create task
const createTask = async () => {
  const response = await api.post('/tasks', {
    title: 'New Task',
    due: '2024-12-31',
    priority: 'high'
  });
  return response.data;
};
```

### cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"password123"}' \
  -c cookies.txt

# Create task (with session cookie)
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"New Task","due":"2024-12-31","priority":"high"}'
```

---

**Last Updated**: December 2024
**API Version**: 1.0.0
