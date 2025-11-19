const redis = require('redis')

// Redis configuration for caching and session management
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis connection refused')
      return new Error('Redis connection refused')
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('Redis retry time exhausted')
      return new Error('Retry time exhausted')
    }
    if (options.attempt > 10) {
      console.error('Redis retry attempts exhausted')
      return undefined
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000)
  }
}

// Create Redis client
let redisClient = null

if (process.env.NODE_ENV !== 'test') {
  redisClient = redis.createClient(redisConfig)

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err)
  })

  redisClient.on('connect', () => {
    console.log('Connected to Redis')
  })

  redisClient.on('ready', () => {
    console.log('Redis client ready')
  })

  redisClient.on('end', () => {
    console.log('Redis connection ended')
  })

  // Connect to Redis
  redisClient.connect().catch(console.error)
}

// Cache operations wrapper
const cache = {
  async get(key) {
    if (!redisClient) return null
    try {
      const value = await redisClient.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  },

  async set(key, value, expireInSeconds = null) {
    if (!redisClient) return false
    try {
      const serializedValue = JSON.stringify(value)
      if (expireInSeconds) {
        await redisClient.setEx(key, expireInSeconds, serializedValue)
      } else {
        await redisClient.set(key, serializedValue)
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  },

  async del(key) {
    if (!redisClient) return false
    try {
      await redisClient.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  },

  async expire(key, seconds) {
    if (!redisClient) return false
    try {
      await redisClient.expire(key, seconds)
      return true
    } catch (error) {
      console.error('Redis EXPIRE error:', error)
      return false
    }
  },

  async exists(key) {
    if (!redisClient) return false
    try {
      const result = await redisClient.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  },

  // Session management
  async setSession(sessionId, data, expireInSeconds = 3600) {
    return this.set(`session:${sessionId}`, data, expireInSeconds)
  },

  async getSession(sessionId) {
    return this.get(`session:${sessionId}`)
  },

  async deleteSession(sessionId) {
    return this.del(`session:${sessionId}`)
  },

  // Cache management
  async invalidatePattern(pattern) {
    if (!redisClient) return false
    try {
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(keys)
      }
      return true
    } catch (error) {
      console.error('Redis pattern invalidation error:', error)
      return false
    }
  },

  // Health check
  async ping() {
    if (!redisClient) return false
    try {
      const result = await redisClient.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Redis PING error:', error)
      return false
    }
  }
}

module.exports = {
  redisClient,
  cache,
  redisConfig
}