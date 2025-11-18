import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import User from '../models/User.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (if using cookie-based auth)
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // Check for token in query parameters (for WebSocket auth)
    if (!token && req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user from token
      const user = await User.findById(decoded.userId).select('+password');

      if (!user) {
        return next(new AppError('Token is valid but user no longer exists.', 401));
      }

      // Check if user is active (you can add an isActive field to User model)
      if (user.role === 'suspended') {
        return next(new AppError('Account has been suspended. Please contact support.', 403));
      }

      // Add user to request
      req.user = user;

      // Update last active timestamp (throttled to avoid too many DB writes)
      const now = Date.now();
      if (!req.user.lastActive || (now - req.user.lastActive.getTime()) > 300000) { // 5 minutes
        await user.updateLastActive();
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Token has expired. Please log in again.', 401));
      } else if (error.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token. Please log in again.', 401));
      } else {
        return next(new AppError('Token verification failed.', 401));
      }
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    next(new AppError('Authentication failed.', 500));
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not authorized to access this resource.`, 403));
    }

    next();
  };
};

// Check if user owns the resource or has admin privileges
export const ownerOrAdmin = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Admins can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (!resourceUserId) {
      return next(new AppError('Resource user ID not found.', 400));
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
      return next(new AppError('Access denied. You can only access your own resources.', 403));
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (req.query?.token) {
      token = req.query.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.userId);

        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Silently fail for optional auth
        logger.debug('Optional auth token invalid:', error.message);
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

// Verify refresh token
export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required.', 400));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    if (decoded.type !== 'refresh') {
      return next(new AppError('Invalid refresh token type.', 401));
    }

    // Find user with this refresh token
    const user = await User.findByRefreshToken(refreshToken);

    if (!user) {
      return next(new AppError('Refresh token is invalid or expired.', 401));
    }

    req.user = user;
    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Refresh token has expired. Please log in again.', 401));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid refresh token.', 401));
    } else {
      logger.error('Refresh token verification error:', error);
      next(new AppError('Token verification failed.', 401));
    }
  }
};

// Rate limiting for auth endpoints
export const authLimiter = (req, res, next) => {
  // Implement stricter rate limiting for auth endpoints
  // This would be handled by the general rate limiter with specific rules
  next();
};

// Log authentication events
export const logAuth = (action) => {
  return (req, res, next) => {
    const userId = req.user?._id;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    logger.auth(action, userId, {
      ipAddress,
      userAgent,
      endpoint: req.originalUrl,
      method: req.method
    });

    next();
  };
};

// Workspace-based authorization
export const workspaceMember = (workspaceIdParam = 'workspaceId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required.', 401));
      }

      const workspaceId = req.params[workspaceIdParam];

      if (!workspaceId) {
        return next(new AppError('Workspace ID is required.', 400));
      }

      // Import Workspace model here to avoid circular dependencies
      const Workspace = (await import('../models/Workspace.js')).default;

      const workspace = await Workspace.findById(workspaceId);

      if (!workspace) {
        return next(new AppError('Workspace not found.', 404));
      }

      // Check if user is a member of the workspace
      const membership = workspace.members.find(
        member => member.user.toString() === req.user._id.toString()
      );

      if (!membership) {
        return next(new AppError('Access denied. You are not a member of this workspace.', 403));
      }

      // Add workspace and membership info to request
      req.workspace = workspace;
      req.membership = membership;

      next();
    } catch (error) {
      logger.error('Workspace authorization error:', error);
      next(new AppError('Authorization failed.', 500));
    }
  };
};

// Admin or workspace admin authorization
export const workspaceAdmin = (workspaceIdParam = 'workspaceId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required.', 401));
      }

      // Global admins can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const workspaceId = req.params[workspaceIdParam];

      if (!workspaceId) {
        return next(new AppError('Workspace ID is required.', 400));
      }

      // Import Workspace model here to avoid circular dependencies
      const Workspace = (await import('../models/Workspace.js')).default;

      const workspace = await Workspace.findById(workspaceId);

      if (!workspace) {
        return next(new AppError('Workspace not found.', 404));
      }

      // Check if user is an admin of the workspace
      const membership = workspace.members.find(
        member => member.user.toString() === req.user._id.toString()
      );

      if (!membership || membership.role !== 'admin') {
        return next(new AppError('Access denied. Admin privileges required for this workspace.', 403));
      }

      // Add workspace and membership info to request
      req.workspace = workspace;
      req.membership = membership;

      next();
    } catch (error) {
      logger.error('Workspace admin authorization error:', error);
      next(new AppError('Authorization failed.', 500));
    }
  };
};