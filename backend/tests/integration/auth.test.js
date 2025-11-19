const request = require('supertest')
const app = require('../../src/server')
const User = require('../../src/models/User')

describe('Authentication API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toMatchObject({
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
      })
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('should return 400 for duplicate email', async () => {
      // First create a user
      await User.create({
        email: 'duplicate@example.com',
        username: 'duplicate',
        firstName: 'Duplicate',
        lastName: 'User',
        password: 'password123',
      })

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'duplicate2',
          firstName: 'Duplicate',
          lastName: 'User2',
          password: 'password123',
        })
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('DUPLICATE_EMAIL')
    })

    it('should return 400 for duplicate username', async () => {
      // First create a user
      await User.create({
        email: 'user1@example.com',
        username: 'sameusername',
        firstName: 'User',
        lastName: 'One',
        password: 'password123',
      })

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user2@example.com',
          username: 'sameusername',
          firstName: 'User',
          lastName: 'Two',
          password: 'password123',
        })
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('DUPLICATE_USERNAME')
    })

    it('should return 422 for invalid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: '',
          firstName: '',
          lastName: '',
          password: '123',
        })
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toBeDefined()
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        email: 'login@example.com',
        username: 'loginuser',
        firstName: 'Login',
        lastName: 'User',
        password: 'password123',
      })
    })

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toMatchObject({
        email: 'login@example.com',
        username: 'loginuser',
        firstName: 'Login',
        lastName: 'User',
      })
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should return 422 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/auth/me', () => {
    let authToken
    let testUser

    beforeEach(async () => {
      // Create and login a test user
      testUser = await User.create({
        email: 'me@example.com',
        username: 'meuser',
        firstName: 'Me',
        lastName: 'User',
        password: 'password123',
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123',
        })

      authToken = loginResponse.body.data.token
    })

    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
        email: 'me@example.com',
        username: 'meuser',
        firstName: 'Me',
        lastName: 'User',
      })
      expect(response.body.data.password).toBeUndefined()
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('NO_TOKEN')
    })

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_TOKEN')
    })
  })

  describe('POST /api/auth/refresh', () => {
    let refreshToken
    let testUser

    beforeEach(async () => {
      // Create and login a test user
      testUser = await User.create({
        email: 'refresh@example.com',
        username: 'refreshuser',
        firstName: 'Refresh',
        lastName: 'User',
        password: 'password123',
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'password123',
        })

      refreshToken = loginResponse.body.data.refreshToken
    })

    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.user).toMatchObject({
        email: 'refresh@example.com',
        username: 'refreshuser',
      })
    })

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN')
    })

    it('should return 422 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/logout', () => {
    let authToken

    beforeEach(async () => {
      // Create and login a test user
      await User.create({
        email: 'logout@example.com',
        username: 'logoutuser',
        firstName: 'Logout',
        lastName: 'User',
        password: 'password123',
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'password123',
        })

      authToken = loginResponse.body.data.token
    })

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe('Logged out successfully')
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('NO_TOKEN')
    })
  })
})