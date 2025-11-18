import logger from '../utils/logger.js';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error handler
export const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// MongoDB duplicate key error handler
export const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} - '${value}'. Please use another value!`;
  return new AppError(message, 400);
};

// MongoDB cast error handler
export const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// JWT error handler
export const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

export const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.status,
      message: err.message,
      stack: err.stack,
      ...(err.errors && { details: err.errors }),
    },
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.status,
        message: err.message,
        ...(err.errors && { details: err.errors }),
      },
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      error: {
        code: 'error',
        message: 'Something went wrong!',
      },
    });
  }
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user._id : null,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') error = handleCastError(error);

  // Mongoose duplicate key
  if (err.code === 11000) error = handleDuplicateKeyError(error);

  // Mongoose validation error
  if (err.name === 'ValidationError') error = handleValidationError(error);

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Send appropriate error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler
export const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};