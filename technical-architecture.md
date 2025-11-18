# CollabTask - Technical Architecture Documentation

## 🏗️ System Architecture Overview

### Architecture Pattern
**Microservices Architecture with Real-time Communication**

The CollabTask platform follows a microservices-inspired architecture with clear separation of concerns, utilizing a three-tier structure:
- **Presentation Layer**: React frontend with real-time capabilities
- **Business Logic Layer**: Express.js API with modular endpoints
- **Data Layer**: MongoDB with Redis caching and Socket.io for real-time features

### System Components Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser (React App)         │  Mobile App (React Native)   │
│  - Real-time UI Updates          │  - Responsive Design         │
│  - WebSocket Connection          │  - Offline Capability        │
│  - State Management              │  - Push Notifications        │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                              HTTPS/WSS
                                  │
┌─────────────────────────────────┴───────────────────────────────┐
│                      API Gateway Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Load Balancer (Nginx/Cloudflare)                              │
│  - SSL Termination                  │  Rate Limiting             │
│  - Request Routing                  │  CORS Handling             │
│  - Compression                      │  Security Headers          │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
┌─────────────────────────────────┴───────────────────────────────┐
│                      Application Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Server (Node.js)                                    │
│  ├─ Authentication Module                                      │
│  ├─ User Management                                            │
│  ├─ Project Management                                         │
│  ├─ Task Management                                            │
│  ├─ Real-time Communication                                    │
│  ├─ File Management                                            │
│  └─ Analytics & Reporting                                      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
┌─────────────────────────────────┴───────────────────────────────┐
│                      Data Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB Atlas              │  Redis Cloud    │  File Storage   │
│  - User Data                │  - Session      │  - AWS S3       │
│  - Projects                 │  - Cache        │  - CDN          │
│  - Tasks                    │  - Real-time    │  - Backup       │
│  - Comments                 │  - Pub/Sub      │  - Versioning   │
│  - Activity Logs            │                 │                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack Selection & Justification

### Backend Technology Stack

#### Node.js & Express.js (v18+)
**Justification:**
- **JavaScript Ecosystem**: Unified language across full stack reduces cognitive overhead
- **Performance**: V8 engine provides excellent performance for I/O-intensive operations
- **Real-time Features**: Native support for WebSocket libraries and event-driven architecture
- **Ecosystem**: Rich npm ecosystem with mature packages for authentication, validation, and testing
- **Scalability**: Proven to handle high-concurrency scenarios (Netflix, Uber, LinkedIn)

**Version Selection:**
- Node.js 18 LTS: Long-term support, modern JavaScript features, better performance
- Express.js 4.x: Stable, well-documented, extensive middleware ecosystem

#### MongoDB (v6+)
**Justification:**
- **Schema Flexibility**: Dynamic schema perfect for evolving project requirements
- **JSON-native**: Direct mapping between JavaScript objects and database documents
- **Real-time Features**: Built-in change streams for real-time updates
- **Scalability**: Horizontal scaling with sharding, replica sets for high availability
- **Developer Experience**: Mongoose ODM provides elegant schema validation and relationships

**Version Selection:**
- MongoDB 6.0+: Latest features including time series collections, richer aggregation pipeline
- MongoDB Atlas: Managed service with automatic scaling, backup, and monitoring

#### Socket.io (v4+)
**Justification:**
- **Real-time Communication**: Handles WebSocket fallbacks automatically
- **Event-driven Architecture**: Perfect fit for collaborative features
- **Room Management**: Built-in support for project-based user grouping
- **Reliability**: Connection management, reconnection logic, and heartbeat monitoring

### Frontend Technology Stack

#### React (v18+)
**Justification:**
- **Component Architecture**: Reusable components ideal for complex UI
- **State Management**: Excellent ecosystem (Redux, Context API, React Query)
- **Performance**: Virtual DOM, concurrent features, and optimization techniques
- **Developer Experience**: Rich tooling, extensive documentation, large community

**Version Selection:**
- React 18: Concurrent features, automatic batching, new hooks (useId, useDeferredValue)
- TypeScript: Type safety, better IDE support, reduced runtime errors

#### Redux Toolkit
**Justification:**
- **State Management**: Predictable state updates, time-travel debugging
- **Middleware**: RTK Query for data fetching, redux-thunk for async actions
- **DevTools**: Excellent debugging experience with Redux DevTools
- **Scalability**: Handles complex state logic across large applications

#### Material-UI (v5+)
**Justification:**
- **Design System**: Consistent, accessible components out of the box
- **Customization**: Powerful theming system for brand consistency
- **Responsiveness**: Built-in responsive design patterns
- **Accessibility**: WCAG 2.1 AA compliance by default

### Infrastructure & DevOps

#### Cloud Platform: Heroku + Netlify
**Justification:**
- **Heroku for Backend**: Simple deployment, add-ons ecosystem, automatic scaling
- **Netlify for Frontend**: JAMstack optimization, global CDN, automatic HTTPS
- **Cost-effective**: Free tiers available, pay-as-you-scale model
- **Integration**: Easy CI/CD setup with GitHub integration

#### Database: MongoDB Atlas
**Justification:**
- **Managed Service**: No infrastructure management overhead
- **Global Distribution**: Multi-region deployment for low latency
- **Automated Scaling**: Automatic resource allocation based on demand
- **Backup & Recovery**: Built-in backup, point-in-time recovery

#### Caching & Real-time: Redis Cloud
**Justification:**
- **High Performance**: In-memory data store for sub-millisecond access
- **Real-time Features**: Pub/Sub for Socket.io scaling
- **Session Storage**: Distributed session management
- **Managed Service**: Redis Labs managed cloud offering

### Development Tools & Quality Assurance

#### Version Control: Git + GitHub
- **Branching Strategy**: GitFlow with feature branches, release branches
- **Code Review**: Pull request workflow with required reviews
- **CI/CD**: GitHub Actions for automated testing and deployment

#### Testing Framework: Jest + Cypress
- **Jest**: Unit testing, integration testing for backend and frontend
- **Cypress**: End-to-end testing with real browser automation
- **Supertest**: API endpoint testing for Express.js applications
- **React Testing Library**: Component testing with user-centric approach

#### Code Quality: ESLint + Prettier + SonarQube
- **ESLint**: Static code analysis, custom rules for project conventions
- **Prettier**: Automatic code formatting, consistent style
- **SonarQube**: Code quality monitoring, technical debt tracking

## 📊 Data Models & Database Relationships

### Core Entities

#### 1. User Entity
```javascript
// User Schema
{
  _id: ObjectId,
  email: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: String,
  password: { type: String, required: true }, // hashed
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notifications: {
      email: Boolean,
      push: Boolean,
      inApp: Boolean
    }
  },
  lastActive: Date,
  isOnline: { type: Boolean, default: false },
  timezone: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "lastActive": 1 })
```

#### 2. Workspace/Project Entity
```javascript
// Workspace Schema
{
  _id: ObjectId,
  name: { type: String, required: true },
  description: String,
  slug: { type: String, unique: true, required: true },
  owner: { type: ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
    joinedAt: Date
  }],
  settings: {
    isPublic: { type: Boolean, default: false },
    allowGuestAccess: { type: Boolean, default: false },
    defaultTaskView: { type: String, enum: ['kanban', 'list', 'calendar'], default: 'kanban' }
  },
  branding: {
    primaryColor: String,
    logo: String
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.workspaces.createIndex({ "owner": 1 })
db.workspaces.createIndex({ "slug": 1 }, { unique: true })
db.workspaces.createIndex({ "members.user": 1 })
```

#### 3. Task Entity
```javascript
// Task Schema
{
  _id: ObjectId,
  title: { type: String, required: true },
  description: String,
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'review', 'done'], 
    default: 'todo' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  workspace: { type: ObjectId, ref: 'Workspace', required: true },
  assignees: [{ type: ObjectId, ref: 'User' }],
  createdBy: { type: ObjectId, ref: 'User', required: true },
  dueDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  tags: [String],
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: { type: ObjectId, ref: 'User' },
    uploadedAt: Date
  }],
  dependencies: [{ type: ObjectId, ref: 'Task' }],
  subtasks: [{
    title: String,
    completed: { type: Boolean, default: false },
    assignedTo: { type: ObjectId, ref: 'User' }
  }],
  comments: [{ type: ObjectId, ref: 'Comment' }],
  activity: [{
    type: String, // 'created', 'updated', 'status_changed', 'assigned', etc.
    user: { type: ObjectId, ref: 'User' },
    timestamp: Date,
    details: Mixed
  }],
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.tasks.createIndex({ "workspace": 1 })
db.tasks.createIndex({ "assignees": 1 })
db.tasks.createIndex({ "status": 1 })
db.tasks.createIndex({ "dueDate": 1 })
db.tasks.createIndex({ "createdBy": 1 })
db.tasks.createIndex({ "tags": 1 })
```

#### 4. Comment Entity
```javascript
// Comment Schema
{
  _id: ObjectId,
  content: { type: String, required: true },
  author: { type: ObjectId, ref: 'User', required: true },
  task: { type: ObjectId, ref: 'Task', required: true },
  mentions: [{ type: ObjectId, ref: 'User' }],
  attachments: [{
    filename: String,
    url: String
  }],
  reactions: [{
    user: { type: ObjectId, ref: 'User' },
    emoji: String // '👍', '❤️', '😄', etc.
  }],
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.comments.createIndex({ "task": 1 })
db.comments.createIndex({ "author": 1 })
db.comments.createIndex({ "mentions": 1 })
```

#### 5. Activity Log Entity
```javascript
// Activity Schema
{
  _id: ObjectId,
  type: String, // 'task_created', 'user_joined', 'workspace_updated', etc.
  workspace: { type: ObjectId, ref: 'Workspace' },
  user: { type: ObjectId, ref: 'User' },
  target: Mixed, // References to the affected entity
  metadata: Mixed, // Additional context data
  timestamp: { type: Date, default: Date.now }
}

// Indexes
db.activities.createIndex({ "workspace": 1, "timestamp": -1 })
db.activities.createIndex({ "user": 1, "timestamp": -1 })
db.activities.createIndex({ "type": 1, "timestamp": -1 })
```

### Data Relationships

#### Relationship Diagram
```
Users ───< Workspace Members >─── Workspaces ───< Tasks
  │                                   │
  │                                   │
  └─< Comments >───────┘              └─< Subtasks >
                                          │
                                          │
                                     Comments ───< Mentions >─── Users
```

#### Relationship Details
1. **User to Workspace**: Many-to-Many (via workspace.members)
2. **User to Task**: Many-to-Many (via task.assignees)
3. **Workspace to Task**: One-to-Many
4. **Task to Comment**: One-to-Many
5. **User to Comment**: One-to-Many
6. **Task to Activity**: One-to-Many

### Database Design Decisions

#### 1. Normalization Strategy
- **Moderate Normalization**: Balance between data integrity and query performance
- **Embedded Documents**: For frequently accessed related data (subtasks within tasks)
- **References**: For cross-document relationships (users across workspaces)

#### 2. Indexing Strategy
- **Compound Indexes**: For multi-field queries (workspace + status + dueDate)
- **Partial Indexes**: For filtered queries (only active users)
- **Text Indexes**: For full-text search (task descriptions, comments)

#### 3. Performance Optimization
- **Aggregation Pipeline**: For complex reporting queries
- **Data Archiving**: Archive old activities and completed tasks
- **Connection Pooling**: Reuse database connections for better performance

#### 4. Data Migration Strategy
```javascript
// Migration Script Example
db.users.updateMany(
  { lastActive: { $exists: false } },
  { $set: { lastActive: new Date() } }
);

// Add new indexes
db.tasks.createIndex({ "workspace": 1, "status": 1, "dueDate": 1 });

// Data validation schema updates
db.runCommand({
  collMod: "tasks",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "workspace", "createdBy"],
      properties: {
        title: { bsonType: "string" },
        priority: { enum: ["low", "medium", "high", "urgent"] }
      }
    }
  }
});
```

## 🔌 API Structure & Endpoints

### RESTful API Design Principles

#### URL Structure
```
https://api.collabtask.com/v1/
├── auth/              # Authentication endpoints
├── users/             # User management
├── workspaces/        # Workspace/project management
├── tasks/             # Task management
├── comments/          # Comment system
├── files/             # File uploads
├── notifications/     # Real-time notifications
└── analytics/         # Reporting and analytics
```

#### HTTP Methods & Status Codes
- **GET**: Retrieve resources (200 OK)
- **POST**: Create new resources (201 Created)
- **PUT**: Update entire resources (200 OK)
- **PATCH**: Partial resource updates (200 OK)
- **DELETE**: Remove resources (204 No Content)
- **Error Responses**: Consistent error format (400, 401, 403, 404, 422, 500)

### Authentication Endpoints

#### POST /auth/register
```javascript
// Request
{
  email: "user@example.com",
  password: "securePassword123",
  firstName: "John",
  lastName: "Doe",
  username: "johndoe"
}

// Response (201 Created)
{
  success: true,
  data: {
    user: {
      _id: "507f1f77bcf86cd799439011",
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
      username: "johndoe"
    },
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    expiresAt: "2023-12-31T23:59:59.999Z"
  }
}
```

#### POST /auth/login
```javascript
// Request
{
  email: "user@example.com",
  password: "securePassword123"
}

// Response (200 OK)
{
  success: true,
  data: {
    user: { /* user object */ },
    token: "jwt_token_here",
    refreshToken: "refresh_token_here"
  }
}
```

#### POST /auth/refresh
#### POST /auth/logout
#### GET /auth/me

### User Management Endpoints

#### GET /users/profile
```javascript
// Response (200 OK)
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439011",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    avatar: "https://cdn.example.com/avatars/johndoe.jpg",
    preferences: {
      theme: "light",
      notifications: {
        email: true,
        push: true,
        inApp: true
      }
    },
    workspaces: [
      {
        _id: "507f1f77bcf86cd799439012",
        name: "Marketing Team",
        role: "admin",
        slug: "marketing-team"
      }
    ]
  }
}
```

#### PUT /users/profile
#### POST /users/avatar
#### GET /users/search?query=john

### Workspace Management Endpoints

#### GET /workspaces
```javascript
// Response (200 OK)
{
  success: true,
  data: [
    {
      _id: "507f1f77bcf86cd799439012",
      name: "Marketing Team",
      description: "Team collaboration for marketing projects",
      slug: "marketing-team",
      role: "admin",
      memberCount: 8,
      taskCount: 45,
      lastActivity: "2023-11-18T10:30:00.000Z",
      settings: {
        isPublic: false,
        defaultTaskView: "kanban"
      }
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 5,
    pages: 1
  }
}
```

#### POST /workspaces
```javascript
// Request
{
  name: "Development Team",
  description: "Software development projects",
  settings: {
    isPublic: false,
    defaultTaskView: "kanban"
  }
}

// Response (201 Created)
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439013",
    name: "Development Team",
    slug: "development-team",
    role: "admin",
    memberCount: 1,
    createdAt: "2023-11-18T15:45:00.000Z"
  }
}
```

#### GET /workspaces/:workspaceId
#### PUT /workspaces/:workspaceId
#### DELETE /workspaces/:workspaceId
#### POST /workspaces/:workspaceId/members
#### DELETE /workspaces/:workspaceId/members/:userId

### Task Management Endpoints

#### GET /workspaces/:workspaceId/tasks
```javascript
// Query Parameters: ?status=in-progress&assignee=507f1f77bcf86cd799439011&page=1&limit=20

// Response (200 OK)
{
  success: true,
  data: [
    {
      _id: "507f1f77bcf86cd799439014",
      title: "Design new landing page",
      description: "Create wireframes and mockups for the new product landing page",
      status: "in-progress",
      priority: "high",
      assignees: [
        {
          _id: "507f1f77bcf86cd799439011",
          firstName: "John",
          lastName: "Doe",
          avatar: "https://cdn.example.com/avatars/johndoe.jpg"
        }
      ],
      dueDate: "2023-11-25T17:00:00.000Z",
      estimatedHours: 8,
      tags: ["design", "frontend"],
      createdBy: {
        _id: "507f1f77bcf86cd799439011",
        firstName: "John",
        lastName: "Doe"
      },
      createdAt: "2023-11-18T09:00:00.000Z",
      updatedAt: "2023-11-18T15:30:00.000Z"
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 45,
    pages: 3
  },
  filters: {
    availableStatuses: ["todo", "in-progress", "review", "done"],
    availablePriorities: ["low", "medium", "high", "urgent"],
    assignableUsers: [ /* user list */ ]
  }
}
```

#### POST /workspaces/:workspaceId/tasks
```javascript
// Request
{
  title: "Implement user authentication",
  description: "Set up JWT-based authentication system",
  assignees: ["507f1f77bcf86cd799439011"],
  priority: "high",
  dueDate: "2023-11-30T17:00:00.000Z",
  estimatedHours: 16,
  tags: ["backend", "security"],
  dependencies: ["507f1f77bcf86cd799439015"]
}

// Response (201 Created)
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439016",
    title: "Implement user authentication",
    workspace: "507f1f77bcf86cd799439013",
    status: "todo",
    activity: [
      {
        type: "created",
        user: "507f1f77bcf86cd799439011",
        timestamp: "2023-11-18T15:45:00.000Z"
      }
    ],
    createdAt: "2023-11-18T15:45:00.000Z"
  }
}
```

#### GET /tasks/:taskId
#### PUT /tasks/:taskId
#### PATCH /tasks/:taskId/status
#### DELETE /tasks/:taskId
#### POST /tasks/:taskId/comments

### Comment System Endpoints

#### GET /tasks/:taskId/comments
```javascript
// Response (200 OK)
{
  success: true,
  data: [
    {
      _id: "507f1f77bcf86cd799439017",
      content: "I've started working on the wireframes. Will share them by tomorrow.",
      author: {
        _id: "507f1f77bcf86cd799439011",
        firstName: "John",
        lastName: "Doe",
        avatar: "https://cdn.example.com/avatars/johndoe.jpg"
      },
      mentions: [
        {
          _id: "507f1f77bcf86cd799439018",
          firstName: "Jane",
          lastName: "Smith"
        }
      ],
      reactions: [
        {
          user: "507f1f77bcf86cd799439018",
          emoji: "👍"
        }
      ],
      createdAt: "2023-11-18T14:30:00.000Z"
    }
  ]
}
```

#### POST /tasks/:taskId/comments
#### PUT /comments/:commentId
#### DELETE /comments/:commentId
#### POST /comments/:commentId/reactions

### File Management Endpoints

#### POST /files/upload
```javascript
// Multipart Form Data
// - file: binary file data
// - workspaceId: string
// - taskId: string (optional)

// Response (201 Created)
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439019",
    filename: "wireframe-v2.fig",
    originalName: "Landing Page Wireframes v2.fig",
    url: "https://storage.collabtask.com/files/wireframe-v2.fig",
    size: 2048576,
    mimeType: "application/octet-stream",
    uploadedBy: "507f1f77bcf86cd799439011",
    task: "507f1f77bcf86cd799439014",
    createdAt: "2023-11-18T16:00:00.000Z"
  }
}
```

#### GET /files/:fileId
#### DELETE /files/:fileId

### Real-time Features via WebSocket

#### Connection & Authentication
```javascript
// Client Connection
const socket = io('wss://api.collabtask.com', {
  auth: {
    token: 'jwt_token_here'
  },
  transports: ['websocket']
});

// Authentication Response
{
  success: true,
  data: {
    user: { /* user object */ },
    workspaces: [ /* user's workspaces */ ]
  }
}
```

#### Real-time Events

**Task Updates**
```javascript
// Server emits when task is updated
socket.emit('task:updated', {
  workspaceId: '507f1f77bcf86cd799439013',
  taskId: '507f1f77bcf86cd799439014',
  changes: {
    status: 'in-progress',
    updatedBy: '507f1f77bcf86cd799439011'
  }
});

// Client listens for task updates
socket.on('task:updated', (data) => {
  // Update local state with new task data
});
```

**Real-time Comments**
```javascript
// Server emits when new comment is added
socket.emit('comment:created', {
  workspaceId: '507f1f77bcf86cd799439013',
  taskId: '507f1f77bcf86cd799439014',
  comment: { /* comment object */ }
});
```

**User Presence**
```javascript
// Server tracks and broadcasts user presence
socket.emit('user:presence', {
  userId: '507f1f77bcf86cd799439011',
  workspaceId: '507f1f77bcf86cd799439013',
  status: 'online' // 'online', 'away', 'offline'
});
```

### API Response Standards

#### Success Response Format
```javascript
{
  success: true,
  data: { /* requested data */ },
  pagination?: {
    page: 1,
    limit: 20,
    total: 100,
    pages: 5
  },
  meta?: {
    timestamp: "2023-11-18T15:45:00.000Z",
    requestId: "req_123456789"
  }
}
```

#### Error Response Format
```javascript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: [
      {
        field: "email",
        message: "Email is required"
      },
      {
        field: "password",
        message: "Password must be at least 8 characters"
      }
    ]
  },
  meta: {
    timestamp: "2023-11-18T15:45:00.000Z",
    requestId: "req_123456789"
  }
}
```

#### HTTP Status Code Mapping
- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### API Documentation Strategy

#### OpenAPI/Swagger Documentation
- **Interactive Documentation**: Swagger UI for API exploration
- **Request/Response Examples**: Complete examples for all endpoints
- **Authentication Guide**: JWT token usage and examples
- **Error Code Reference**: Comprehensive error code documentation

#### Rate Limiting Strategy
```javascript
// Rate limiting configuration
const rateLimiter = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 },      // 5 attempts per 15 minutes
  api: { windowMs: 15 * 60 * 1000, max: 100 },     // 100 requests per 15 minutes
  upload: { windowMs: 60 * 60 * 1000, max: 10 }    // 10 uploads per hour
};
```

This technical architecture provides a solid foundation for building the CollabTask platform with scalability, maintainability, and excellent user experience in mind.