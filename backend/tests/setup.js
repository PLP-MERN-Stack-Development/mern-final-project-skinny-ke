const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
const { MongoClient } = require('mongodb')

let mongoServer

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()

  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  // Set test environment
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
  process.env.MONGODB_URI = mongoUri
})

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections

  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()

  // Stop the in-memory MongoDB server
  if (mongoServer) {
    await mongoServer.stop()
  }
})

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  // Keep log and warn for debugging if needed
  // log: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}

// Global test utilities
global.createTestUser = async (userData = {}) => {
  const User = require('../src/models/User')
  const defaultUser = {
    email: `test${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
    ...userData
  }

  const user = new User(defaultUser)
  await user.save()
  return user
}

global.createTestWorkspace = async (workspaceData = {}) => {
  const Workspace = require('../src/models/Workspace')
  const defaultWorkspace = {
    name: `Test Workspace ${Date.now()}`,
    slug: `test-workspace-${Date.now()}`,
    description: 'A test workspace',
    owner: null, // Should be set by caller
    ...workspaceData
  }

  const workspace = new Workspace(defaultWorkspace)
  await workspace.save()
  return workspace
}

global.createTestTask = async (taskData = {}) => {
  const Task = require('../src/models/Task')
  const defaultTask = {
    title: `Test Task ${Date.now()}`,
    description: 'A test task description',
    workspace: null, // Should be set by caller
    createdBy: null, // Should be set by caller
    ...taskData
  }

  const task = new Task(defaultTask)
  await task.save()
  return task
}

global.generateAuthToken = (userId) => {
  const jwt = require('jsonwebtoken')
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

// Mock external services
jest.mock('../src/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
}))

// Mock email service
jest.mock('../src/services/emailService', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendNotificationEmail: jest.fn(),
}))

// Mock file upload service
jest.mock('../src/services/fileService', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileUrl: jest.fn(),
}))

// Increase timeout for tests that might take longer
jest.setTimeout(30000)