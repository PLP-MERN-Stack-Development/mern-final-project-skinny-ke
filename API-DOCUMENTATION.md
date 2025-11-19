# 📋 CollabTask API Documentation

## Overview

The CollabTask API is a comprehensive RESTful API that provides full access to all platform features including real-time collaboration, task management, user authentication, and project analytics.

### Base URL
```
https://api.collabtask.com/v1
```

### Authentication
All API requests require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Response Format
All responses follow a consistent JSON structure:
```json
{
  "success": true,
  "data": { /* response data */ },
  "pagination": { /* pagination info */ },
  "meta": { /* metadata */ }
}
```

### Error Responses
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-12-01T10:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "role": "member",
      "avatar": null,
      "isOnline": false,
      "createdAt": "2024-12-01T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresAt": "2024-12-08T10:00:00.000Z"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR`: Invalid input data
- `USER_EXISTS`: Email or username already taken
- `SERVER_ERROR`: Internal server error

### POST /auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "role": "member",
      "avatar": "https://cdn.collabtask.com/avatars/johndoe.jpg",
      "isOnline": true,
      "lastActive": "2024-12-01T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresAt": "2024-12-08T10:00:00.000Z"
  }
}
```

### POST /auth/refresh
Refresh JWT access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "expiresAt": "2024-12-08T10:00:00.000Z"
  }
}
```

### GET /auth/me
Get current authenticated user information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "role": "member",
    "avatar": "https://cdn.collabtask.com/avatars/johndoe.jpg",
    "preferences": {
      "theme": "light",
      "notifications": {
        "email": true,
        "push": true,
        "inApp": true
      }
    },
    "workspaces": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Marketing Team",
        "role": "admin",
        "slug": "marketing-team"
      }
    ],
    "isOnline": true,
    "lastActive": "2024-12-01T10:00:00.000Z"
  }
}
```

### POST /auth/logout
Logout user and invalidate tokens.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👥 User Management Endpoints

### GET /users/profile
Get current user's profile information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "avatar": "https://cdn.collabtask.com/avatars/johndoe.jpg",
    "preferences": {
      "theme": "light",
      "timezone": "America/New_York",
      "notifications": {
        "email": true,
        "push": true,
        "inApp": true
      }
    },
    "workspaces": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Marketing Team",
        "role": "admin",
        "slug": "marketing-team",
        "memberCount": 8
      }
    ],
    "createdAt": "2024-11-01T10:00:00.000Z",
    "updatedAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### PUT /users/profile
Update user profile information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": false,
      "push": true,
      "inApp": true
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "username": "johndoe",
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": false,
        "push": true,
        "inApp": true
      }
    },
    "updatedAt": "2024-12-01T10:30:00.000Z"
  }
}
```

### POST /users/avatar
Upload user avatar image.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `avatar`: Image file (PNG, JPG, JPEG - max 5MB)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "avatar": "https://cdn.collabtask.com/avatars/johndoe_123456789.jpg",
    "updatedAt": "2024-12-01T10:30:00.000Z"
  }
}
```

### GET /users/search
Search for users by name or email.

**Query Parameters:**
- `query`: Search term (required)
- `limit`: Number of results (default: 20, max: 100)
- `workspace`: Filter by workspace ID

**Example:** `GET /users/search?query=john&limit=10`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "avatar": "https://cdn.collabtask.com/avatars/johndoe.jpg",
      "isOnline": true
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "Johnny",
      "lastName": "Walker",
      "username": "johnnywalker",
      "email": "johnny.walker@example.com",
      "avatar": null,
      "isOnline": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  }
}
```

---

## 🏢 Workspace Management Endpoints

### GET /workspaces
Get user's workspaces.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (default: "updatedAt")
- `order`: Sort order ("asc" or "desc", default: "desc")

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Marketing Team",
      "description": "Q4 Marketing Campaign Planning",
      "slug": "marketing-team",
      "owner": "507f1f77bcf86cd799439011",
      "role": "admin",
      "memberCount": 8,
      "taskCount": 45,
      "settings": {
        "isPublic": false,
        "defaultTaskView": "kanban",
        "allowGuestAccess": false
      },
      "branding": {
        "primaryColor": "#2563EB",
        "logo": "https://cdn.collabtask.com/logos/marketing-team.png"
      },
      "lastActivity": "2024-12-01T09:45:00.000Z",
      "createdAt": "2024-11-01T10:00:00.000Z",
      "updatedAt": "2024-12-01T09:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

### POST /workspaces
Create a new workspace.

**Request Body:**
```json
{
  "name": "Development Team",
  "description": "Software development and engineering",
  "settings": {
    "isPublic": false,
    "defaultTaskView": "kanban",
    "allowGuestAccess": false
  },
  "branding": {
    "primaryColor": "#10B981"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Development Team",
    "description": "Software development and engineering",
    "slug": "development-team",
    "owner": "507f1f77bcf86cd799439011",
    "role": "admin",
    "memberCount": 1,
    "taskCount": 0,
    "settings": {
      "isPublic": false,
      "defaultTaskView": "kanban",
      "allowGuestAccess": false
    },
    "branding": {
      "primaryColor": "#10B981"
    },
    "createdAt": "2024-12-01T10:30:00.000Z",
    "updatedAt": "2024-12-01T10:30:00.000Z"
  }
}
```

### GET /workspaces/{workspaceId}
Get detailed workspace information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Marketing Team",
    "description": "Q4 Marketing Campaign Planning",
    "slug": "marketing-team",
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "avatar": "https://cdn.collabtask.com/avatars/johndoe.jpg"
    },
    "members": [
      {
        "user": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "John",
          "lastName": "Doe",
          "username": "johndoe",
          "avatar": "https://cdn.collabtask.com/avatars/johndoe.jpg"
        },
        "role": "admin",
        "joinedAt": "2024-11-01T10:00:00.000Z"
      },
      {
        "user": {
          "_id": "507f1f77bcf86cd799439015",
          "firstName": "Sarah",
          "lastName": "Smith",
          "username": "sarahsmith",
          "avatar": "https://cdn.collabtask.com/avatars/sarahsmith.jpg"
        },
        "role": "member",
        "joinedAt": "2024-11-02T14:30:00.000Z"
      }
    ],
    "settings": {
      "isPublic": false,
      "defaultTaskView": "kanban",
      "allowGuestAccess": false
    },
    "branding": {
      "primaryColor": "#2563EB",
      "logo": "https://cdn.collabtask.com/logos/marketing-team.png"
    },
    "stats": {
      "totalTasks": 45,
      "completedTasks": 32,
      "overdueTasks": 3,
      "activeMembers": 6
    },
    "createdAt": "2024-11-01T10:00:00.000Z",
    "updatedAt": "2024-12-01T09:45:00.000Z"
  }
}
```

### PUT /workspaces/{workspaceId}
Update workspace information.

**Request Body:**
```json
{
  "name": "Marketing & Sales Team",
  "description": "Combined marketing and sales efforts for Q4",
  "settings": {
    "defaultTaskView": "list"
  },
  "branding": {
    "primaryColor": "#F59E0B"
  }
}
```

### DELETE /workspaces/{workspaceId}
Delete workspace (admin only).

**Response (204 No Content):**

### POST /workspaces/{workspaceId}/members
Invite new member to workspace.

**Request Body:**
```json
{
  "email": "new.member@example.com",
  "role": "member"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "invitationId": "inv_123456789",
    "email": "new.member@example.com",
    "role": "member",
    "expiresAt": "2024-12-08T10:00:00.000Z",
    "inviteUrl": "https://collabtask.com/invite/inv_123456789"
  }
}
```

### DELETE /workspaces/{workspaceId}/members/{userId}
Remove member from workspace.

**Response (204 No Content):**

---

## 📋 Task Management Endpoints

### GET /workspaces/{workspaceId}/tasks
Get workspace tasks with filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status ("todo", "in-progress", "review", "done")
- `priority`: Filter by priority ("low", "medium", "high", "urgent")
- `assignee`: Filter by assignee user ID
- `dueDate`: Filter by due date range ("today", "week", "month", "overdue")
- `tags`: Filter by tags (comma-separated)
- `search`: Search in title and description
- `sort`: Sort field (default: "createdAt")
- `order`: Sort order ("asc" or "desc", default: "desc")

**Example:** `GET /workspaces/507f1f77bcf86cd799439012/tasks?status=in-progress&priority=high&page=1&limit=10`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "title": "Design Landing Page",
      "description": "Create wireframes and mockups for the new product landing page",
      "status": "in-progress",
      "priority": "high",
      "workspace": "507f1f77bcf86cd799439012",
      "assignees": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "John",
          "lastName": "Doe",
          "username": "johndoe",
          "avatar": "https://cdn.collabtask.com/avatars/johndoe.jpg"
        }
      ],
      "createdBy": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe"
      },
      "dueDate": "2024-12-15T17:00:00.000Z",
      "estimatedHours": 16,
      "actualHours": 8,
      "tags": ["design", "frontend", "urgent"],
      "dependencies": ["507f1f77bcf86cd799439017"],
      "subtasks": [
        {
          "title": "Create wireframes",
          "completed": true
        },
        {
          "title": "Design mockups",
          "completed": false
        }
      ],
      "commentCount": 3,
      "attachmentCount": 2,
      "createdAt": "2024-12-01T08:00:00.000Z",
      "updatedAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "filters": {
    "availableStatuses": ["todo", "in-progress", "review", "done"],
    "availablePriorities": ["low", "medium", "high", "urgent"],
    "availableAssignees": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe"
      }
    ],
    "availableTags": ["design", "frontend", "backend", "urgent"]
  }
}
```

### POST /workspaces/{workspaceId}/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Implement User Authentication",
  "description": "Set up JWT-based authentication system with password hashing and session management",
  "priority": "high",
  "assignees": ["507f1f77bcf86cd799439011"],
  "dueDate": "2024-12-20T17:00:00.000Z",
  "estimatedHours": 24,
  "tags": ["backend", "security", "authentication"],
  "dependencies": ["507f1f77bcf86cd799439018"],
  "subtasks": [
    {
      "title": "Set up JWT middleware",
      "completed": false
    },
    {
      "title": "Implement password hashing",
      "completed": false
    },
    {
      "title": "Add session management",
      "completed": false
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439019",
    "title": "Implement User Authentication",
    "description": "Set up JWT-based authentication system with password hashing and session management",
    "status": "todo",
    "priority": "high",
    "workspace": "507f1f77bcf86cd799439012",
    "assignees": ["507f1f77bcf86cd799439011"],
    "createdBy": "507f1f77bcf86cd799439011",
    "dueDate": "2024-12-20T17:00:00.000Z",
    "estimatedHours": 24,
    "tags": ["backend", "security", "authentication"],
    "dependencies": ["507f1f77bcf86cd799439018"],
    "subtasks": [
      {
        "title": "Set up JWT middleware",
        "completed": false
      },
      {
        "title": "Implement password hashing",
        "completed": false
      },
      {
        "title": "Add session management",
        "completed": false
      }
    ],
    "commentCount": 0,
    "attachmentCount": 0,
    "createdAt": "2024-12-01T10:30:00.000Z",
    "updatedAt": "2024-12-01T10:30:00.000Z"
  }
}
```

### GET /tasks/{taskId}
Get detailed task information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "title": "Design Landing Page",
    "description": "Create wireframes and mockups for the new product landing page",
    "status": "in-progress",
    "priority": "high",
    "workspace": "507f1f77bcf86cd799439012",
    "assignees": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe",
        "avatar": "https://cdn.collabtask.com/avatars/johndoe.jpg"
      }
    ],
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe"
    },
    "dueDate": "2024-12-15T17:00:00.000Z",
    "estimatedHours": 16,
    "actualHours": 8,
    "tags": ["design", "frontend", "urgent"],
    "dependencies": ["507f1f77bcf86cd799439017"],
    "subtasks": [
      {
        "title": "Create wireframes",
        "completed": true,
        "assignedTo": "507f1f77bcf86cd799439011",
        "completedAt": "2024-12-01T09:00:00.000Z"
      },
      {
        "title": "Design mockups",
        "completed": false,
        "assignedTo": "507f1f77bcf86cd799439011"
      }
    ],
    "attachments": [
      {
        "filename": "landing-page-wireframes.fig",
        "url": "https://cdn.collabtask.com/files/landing-page-wireframes.fig",
        "size": 2048576,
        "mimeType": "application/octet-stream",
        "uploadedBy": "507f1f77bcf86cd799439011",
        "uploadedAt": "2024-12-01T08:30:00.000Z"
      }
    ],
    "activity": [
      {
        "type": "created",
        "user": "507f1f77bcf86cd799439011",
        "timestamp": "2024-12-01T08:00:00.000Z"
      },
      {
        "type": "status_changed",
        "user": "507f1f77bcf86cd799439011",
        "timestamp": "2024-12-01T08:15:00.000Z",
        "details": {
          "from": "todo",
          "to": "in-progress"
        }
      },
      {
        "type": "comment_added",
        "user": "507f1f77bcf86cd799439015",
        "timestamp": "2024-12-01T09:30:00.000Z",
        "details": {
          "commentId": "507f1f77bcf86cd799439020"
        }
      }
    ],
    "createdAt": "2024-12-01T08:00:00.000Z",
    "updatedAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### PUT /tasks/{taskId}
Update task information.

**Request Body:**
```json
{
  "title": "Design Landing Page - Updated Requirements",
  "status": "review",
  "actualHours": 12,
  "subtasks": [
    {
      "title": "Create wireframes",
      "completed": true
    },
    {
      "title": "Design mockups",
      "completed": true
    },
    {
      "title": "Get client feedback",
      "completed": false
    }
  ]
}
```

### PATCH /tasks/{taskId}/status
Update task status only.

**Request Body:**
```json
{
  "status": "completed"
}
```

### DELETE /tasks/{taskId}
Delete task.

**Response (204 No Content):**

---

## 💬 Comment System Endpoints

### GET /tasks/{taskId}/comments
Get task comments.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "content": "I've completed the wireframes and uploaded them. Please review and let me know if any changes are needed.",
      "author": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe",
        "avatar": "https://cdn.collabtask.com/avatars/johndoe.jpg"
      },
      "task": "507f1f77bcf86cd799439016",
      "mentions": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "firstName": "Sarah",
          "lastName": "Smith",
          "username": "sarahsmith"
        }
      ],
      "attachments": [],
      "reactions": [
        {
          "user": "507f1f77bcf86cd799439015",
          "emoji": "👍",
          "createdAt": "2024-12-01T09:35:00.000Z"
        }
      ],
      "isEdited": false,
      "createdAt": "2024-12-01T09:30:00.000Z",
      "updatedAt": "2024-12-01T09:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3,
    "pages": 1
  }
}
```

### POST /tasks/{taskId}/comments
Add comment to task.

**Request Body:**
```json
{
  "content": "@sarahsmith I've uploaded the new wireframes. Can you please review them by EOD?",
  "mentions": ["507f1f77bcf86cd799439015"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "content": "@sarahsmith I've uploaded the new wireframes. Can you please review them by EOD?",
    "author": "507f1f77bcf86cd799439011",
    "task": "507f1f77bcf86cd799439016",
    "mentions": ["507f1f77bcf86cd799439015"],
    "attachments": [],
    "reactions": [],
    "isEdited": false,
    "createdAt": "2024-12-01T10:45:00.000Z",
    "updatedAt": "2024-12-01T10:45:00.000Z"
  }
}
```

### PUT /comments/{commentId}
Update comment.

**Request Body:**
```json
{
  "content": "@sarahsmith I've uploaded the updated wireframes with your feedback incorporated. Please review them by EOD."
}
```

### DELETE /comments/{commentId}
Delete comment.

**Response (204 No Content):**

### POST /comments/{commentId}/reactions
Add reaction to comment.

**Request Body:**
```json
{
  "emoji": "❤️"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "commentId": "507f1f77bcf86cd799439021",
    "user": "507f1f77bcf86cd799439015",
    "emoji": "❤️",
    "createdAt": "2024-12-01T10:50:00.000Z"
  }
}
```

---

## 📁 File Management Endpoints

### POST /files/upload
Upload file attachment.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File to upload (max 10MB)
- `workspaceId`: Workspace ID (required)
- `taskId`: Task ID (optional)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "filename": "wireframes-v2.fig",
    "originalName": "Landing Page Wireframes v2.fig",
    "url": "https://cdn.collabtask.com/files/wireframes-v2.fig",
    "size": 3145728,
    "mimeType": "application/octet-stream",
    "workspace": "507f1f77bcf86cd799439012",
    "task": "507f1f77bcf86cd799439016",
    "uploadedBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-12-01T11:00:00.000Z"
  }
}
```

### GET /files/{fileId}
Get file information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "filename": "wireframes-v2.fig",
    "originalName": "Landing Page Wireframes v2.fig",
    "url": "https://cdn.collabtask.com/files/wireframes-v2.fig",
    "size": 3145728,
    "mimeType": "application/octet-stream",
    "workspace": "507f1f77bcf86cd799439012",
    "task": "507f1f77bcf86cd799439016",
    "uploadedBy": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe"
    },
    "downloadCount": 5,
    "createdAt": "2024-12-01T11:00:00.000Z"
  }
}
```

### DELETE /files/{fileId}
Delete file.

**Response (204 No Content):**

---

## 📊 Analytics & Reporting Endpoints

### GET /workspaces/{workspaceId}/analytics
Get workspace analytics and insights.

**Query Parameters:**
- `period`: Time period ("week", "month", "quarter", "year", default: "month")
- `startDate`: Start date (ISO 8601 format)
- `endDate`: End date (ISO 8601 format)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTasks": 145,
      "completedTasks": 98,
      "completionRate": 67.6,
      "overdueTasks": 8,
      "averageCompletionTime": 3.2,
      "activeMembers": 12
    },
    "taskStatus": {
      "todo": 23,
      "inProgress": 15,
      "review": 9,
      "done": 98
    },
    "priorityDistribution": {
      "low": 45,
      "medium": 67,
      "high": 28,
      "urgent": 5
    },
    "teamPerformance": [
      {
        "user": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "John",
          "lastName": "Doe",
          "username": "johndoe"
        },
        "tasksCompleted": 24,
        "averageCompletionTime": 2.8,
        "overdueTasks": 1
      }
    ],
    "productivityTrends": [
      {
        "date": "2024-11-25",
        "tasksCompleted": 8,
        "newTasks": 12
      },
      {
        "date": "2024-11-26",
        "tasksCompleted": 6,
        "newTasks": 8
      }
    ],
    "period": "month",
    "generatedAt": "2024-12-01T12:00:00.000Z"
  }
}
```

### GET /workspaces/{workspaceId}/reports
Generate and download reports.

**Query Parameters:**
- `type`: Report type ("tasks", "team", "productivity", "timeline")
- `format`: Export format ("pdf", "csv", "xlsx")
- `startDate`: Start date (ISO 8601 format)
- `endDate`: End date (ISO 8601 format)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reportId": "report_123456789",
    "type": "productivity",
    "format": "pdf",
    "url": "https://cdn.collabtask.com/reports/productivity-report-dec-2024.pdf",
    "expiresAt": "2024-12-08T12:00:00.000Z",
    "generatedAt": "2024-12-01T12:00:00.000Z"
  }
}
```

---

## 🔌 Real-time WebSocket Events

### Connection
```javascript
import io from 'socket.io-client'

const socket = io('wss://api.collabtask.com', {
  auth: {
    token: 'your_jwt_token'
  },
  transports: ['websocket']
})
```

### Task Events

#### Task Updated
```javascript
socket.on('task:updated', (data) => {
  console.log('Task updated:', data)
  // data: { workspaceId, taskId, changes, updatedBy, timestamp }
})
```

#### Task Created
```javascript
socket.on('task:created', (data) => {
  console.log('Task created:', data)
  // data: { workspaceId, task, createdBy, timestamp }
})
```

#### Task Deleted
```javascript
socket.on('task:deleted', (data) => {
  console.log('Task deleted:', data)
  // data: { workspaceId, taskId, deletedBy, timestamp }
})
```

### Comment Events

#### Comment Added
```javascript
socket.on('comment:created', (data) => {
  console.log('Comment added:', data)
  // data: { workspaceId, taskId, comment, author, timestamp }
})
```

#### Comment Updated
```javascript
socket.on('comment:updated', (data) => {
  console.log('Comment updated:', data)
  // data: { workspaceId, taskId, commentId, changes, updatedBy, timestamp }
})
```

### User Presence Events

#### User Online/Offline
```javascript
socket.on('user:presence', (data) => {
  console.log('User presence changed:', data)
  // data: { userId, workspaceId, status, timestamp }
})
```

#### User Typing
```javascript
socket.on('user:typing', (data) => {
  console.log('User typing:', data)
  // data: { userId, workspaceId, taskId, isTyping, timestamp }
})
```

### Workspace Events

#### Member Joined
```javascript
socket.on('workspace:member-joined', (data) => {
  console.log('Member joined workspace:', data)
  // data: { workspaceId, user, role, joinedBy, timestamp }
})
```

#### Member Left
```javascript
socket.on('workspace:member-left', (data) => {
  console.log('Member left workspace:', data)
  // data: { workspaceId, userId, removedBy, timestamp }
})
```

---

## 📋 Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| User Management | 100 requests | 15 minutes |
| Workspace Operations | 200 requests | 15 minutes |
| Task Operations | 500 requests | 15 minutes |
| File Uploads | 10 requests | 1 hour |
| Analytics | 50 requests | 15 minutes |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1638360000
```

---

## 🚨 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid request data | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource conflict | 409 |
| `RATE_LIMITED` | Too many requests | 429 |
| `SERVER_ERROR` | Internal server error | 500 |

---

## 📞 Support

For API support and questions:
- **Documentation**: [docs.collabtask.com/api](https://docs.collabtask.com/api)
- **Issues**: [GitHub Issues](https://github.com/yourusername/collabtask/issues)
- **Email**: api-support@collabtask.com

---

*Last updated: December 1, 2024*