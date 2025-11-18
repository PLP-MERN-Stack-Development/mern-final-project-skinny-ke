import mongoose from 'mongoose';
import config from './index.js';
import logger from '../utils/logger.js';

// MongoDB connection options
const connectionOptions = {
  ...config.database.options,
  // Additional options for better error handling and performance
  bufferCommands: false,
  bufferMaxEntries: 0,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
};

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const maxRetries = 5;

// Connect to MongoDB
export const connectDB = async () => {
  try {
    if (isConnected) {
      logger.info('MongoDB already connected');
      return;
    }

    const mongoURI = process.env.NODE_ENV === 'test'
      ? config.database.testUri
      : config.database.uri;

    logger.info(`Attempting to connect to MongoDB...`);

    const conn = await mongoose.connect(mongoURI, connectionOptions);

    isConnected = true;
    connectionAttempts = 0;

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      isConnected = false;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    connectionAttempts++;
    logger.error(`❌ MongoDB connection error (attempt ${connectionAttempts}/${maxRetries}):`, error.message);

    if (connectionAttempts < maxRetries) {
      logger.info(`Retrying connection in ${connectionAttempts * 2} seconds...`);
      setTimeout(connectDB, connectionAttempts * 2000);
    } else {
      logger.error('❌ Max connection attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

// Disconnect from MongoDB
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('✅ MongoDB disconnected successfully');
  } catch (error) {
    logger.error('❌ Error disconnecting from MongoDB:', error.message);
    throw error;
  }
};

// Get connection status
export const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
  };
};

// Health check for database
export const healthCheck = async () => {
  try {
    if (!isConnected) {
      return { status: 'disconnected', message: 'Database not connected' };
    }

    // Simple ping to check if database is responsive
    await mongoose.connection.db.admin().ping();

    return {
      status: 'healthy',
      message: 'Database connection is healthy',
      details: {
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        readyState: mongoose.connection.readyState,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database health check failed: ${error.message}`,
    };
  }
};

// Reset database (for testing/development)
export const resetDatabase = async () => {
  try {
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      throw new Error('Database reset is only allowed in development or test environment');
    }

    logger.warn('🔄 Resetting database...');

    // Drop all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].drop();
    }

    logger.info('✅ Database reset completed');
  } catch (error) {
    logger.error('❌ Database reset failed:', error.message);
    throw error;
  }
};

export default connectDB;