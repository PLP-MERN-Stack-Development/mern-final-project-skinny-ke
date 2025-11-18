import { body } from 'express-validator';

// User registration validation
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
];

// User login validation
export const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email or username is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Password change validation
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Profile update validation
export const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  body('timezone')
    .optional()
    .isIn([
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
      'Australia/Sydney', 'Africa/Nairobi', 'Asia/Kolkata'
    ])
    .withMessage('Invalid timezone'),

  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),

  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be true or false'),

  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be true or false'),

  body('preferences.notifications.inApp')
    .optional()
    .isBoolean()
    .withMessage('In-app notifications must be true or false')
];

// Forgot password validation
export const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Reset password validation
export const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Email verification validation
export const validateVerifyEmail = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
];

// Workspace creation validation
export const validateCreateWorkspace = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workspace name is required and must be less than 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('settings.isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be true or false'),

  body('settings.allowGuestAccess')
    .optional()
    .isBoolean()
    .withMessage('allowGuestAccess must be true or false'),

  body('settings.defaultTaskView')
    .optional()
    .isIn(['kanban', 'list', 'calendar'])
    .withMessage('Default task view must be kanban, list, or calendar')
];

// Workspace update validation
export const validateUpdateWorkspace = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workspace name must be less than 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('settings.isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be true or false'),

  body('settings.allowGuestAccess')
    .optional()
    .isBoolean()
    .withMessage('allowGuestAccess must be true or false'),

  body('settings.defaultTaskView')
    .optional()
    .isIn(['kanban', 'list', 'calendar'])
    .withMessage('Default task view must be kanban, list, or calendar')
];

// Task creation validation
export const validateCreateTask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title is required and must be less than 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),

  body('estimatedHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Estimated hours must be between 0 and 1000'),

  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),

  body('dependencies')
    .optional()
    .isArray()
    .withMessage('Dependencies must be an array of task IDs')
];

// Task update validation
export const validateUpdateTask = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be less than 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done'])
    .withMessage('Status must be todo, in-progress, review, or done'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),

  body('estimatedHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Estimated hours must be between 0 and 1000'),

  body('actualHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Actual hours must be between 0 and 1000'),

  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

// Comment creation validation
export const validateCreateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and must be less than 1000 characters')
];

// Comment update validation
export const validateUpdateComment = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be less than 1000 characters')
];

// Generic ID validation middleware
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid ${paramName} format`,
          code: 'INVALID_ID'
        }
      });
    }

    next();
  };
};