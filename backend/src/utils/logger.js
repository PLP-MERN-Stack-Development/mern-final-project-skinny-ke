import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true })
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Define transports
const transports = [
  // Error log file
  new winston.transports.File({
    filename: path.join(path.dirname(config.logging.file), 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
  }),

  // Combined log file
  new winston.transports.File({
    filename: config.logging.file,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
  }),
];

// Add console transport for development
if (config.server.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: config.logging.level,
      format: consoleFormat,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(path.dirname(config.logging.file), 'exceptions.log'),
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(path.dirname(config.logging.file), 'rejections.log'),
  })
);

// Custom logging methods
logger.request = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user ? req.user._id : null,
    });
  });

  next();
};

// Database operation logging
logger.database = (operation, collection, data = {}) => {
  logger.info(`Database ${operation}`, {
    collection,
    ...data,
  });
};

// Authentication logging
logger.auth = (action, userId, details = {}) => {
  logger.info(`Auth ${action}`, {
    userId,
    ...details,
  });
};

// Real-time event logging
logger.socket = (event, room, userId, data = {}) => {
  logger.debug(`Socket ${event}`, {
    room,
    userId,
    ...data,
  });
};

// Performance logging
logger.performance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger.log(level, `Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...metadata,
  });
};

export default logger;