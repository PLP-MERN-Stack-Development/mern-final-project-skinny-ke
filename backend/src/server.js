import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import config from './config/index.js';
import connectDB from './config/database.js';
import logger from './utils/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import taskRoutes from './routes/tasks.js';
// Import routes (will be created later)
// import userRoutes from './routes/users.js';
// import commentRoutes from './routes/comments.js';
// import fileRoutes from './routes/files.js';

// Create Express application
const app = express();

// Global server variable for graceful shutdown
let server;

// Trust proxy for rate limiting and logging
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
}));

// CORS configuration
app.use(cors(config.cors));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'TOO_MANY_REQUESTS'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use(logger.request);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    version: '1.0.0',
  });
});

// API routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CollabTask API',
    version: config.server.apiVersion,
    docs: `${req.protocol}://${req.get('host')}${config.server.apiPrefix}/docs`,
  });
});

// API routes
app.use(`${config.server.apiPrefix}/${config.server.apiVersion}/auth`, authRoutes);
app.use(`${config.server.apiPrefix}/${config.server.apiVersion}/workspaces`, workspaceRoutes);
app.use(`${config.server.apiPrefix}/${config.server.apiVersion}/tasks`, taskRoutes);
// app.use(`${config.server.apiPrefix}/${config.server.apiVersion}/users`, userRoutes);
// app.use(`${config.server.apiPrefix}/${config.server.apiVersion}/comments`, commentRoutes);
// app.use(`${config.server.apiPrefix}/${config.server.apiVersion}/files`, fileRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('Process terminated');
    });
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('Process terminated');
    });
  }
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running in ${config.server.nodeEnv} mode on port ${config.server.port}`);
      logger.info(`📡 API available at http://${config.server.host}:${config.server.port}`);
      logger.info(`🏥 Health check at http://${config.server.host}:${config.server.port}/health`);
      logger.info(`📊 Database connected and ready`);
    });

    // Socket.io integration (will be added later)
    // import { initializeSocket } from './socket/index.js';
    // const io = initializeSocket(server);

    return server;
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Socket.io integration (will be added later)
// import { initializeSocket } from './socket/index.js';
// const io = initializeSocket(server);

export default app;