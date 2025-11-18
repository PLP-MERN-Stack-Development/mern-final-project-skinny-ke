import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
  unauthorizedResponse
} from '../utils/response.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const { email, password, firstName, lastName, username } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmailOrUsername(email);
  if (existingUser) {
    return next(new AppError('User with this email or username already exists', 409));
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    username
  });

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Add refresh token to user
  await user.addRefreshToken(refreshToken, req.get('User-Agent'), req.ip);

  // Remove password from response
  user.password = undefined;

  logger.auth('user_registered', user._id, {
    email: user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  createdResponse(res, 'User registered successfully', {
    user: user.toPublicProfile(),
    accessToken,
    refreshToken,
    expiresIn: '7d' // Access token expiry
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findByEmailOrUsername(email).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return unauthorizedResponse(res, 'Invalid email/username or password');
  }

  // Update last active and set online
  await user.setOnlineStatus(true);

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Add refresh token to user
  await user.addRefreshToken(refreshToken, req.get('User-Agent'), req.ip);

  // Remove password from response
  user.password = undefined;

  logger.auth('user_logged_in', user._id, {
    email: user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  successResponse(res, 'Login successful', {
    user: user.toPublicProfile(),
    accessToken,
    refreshToken,
    expiresIn: '7d'
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refreshToken = catchAsync(async (req, res, next) => {
  // The verifyRefreshToken middleware has already validated the token
  // and attached the user to req.user

  const user = req.user;
  const oldRefreshToken = req.refreshToken;

  // Generate new tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Remove old refresh token and add new one
  await user.removeRefreshToken(oldRefreshToken);
  await user.addRefreshToken(refreshToken, req.get('User-Agent'), req.ip);

  logger.auth('token_refreshed', user._id, {
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  successResponse(res, 'Token refreshed successfully', {
    accessToken,
    refreshToken,
    expiresIn: '7d'
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = catchAsync(async (req, res, next) => {
  const user = req.user;
  const refreshToken = req.body.refreshToken;

  if (refreshToken) {
    // Remove specific refresh token
    await user.removeRefreshToken(refreshToken);
  } else {
    // Remove all refresh tokens (logout from all devices)
    await user.removeAllRefreshTokens();
  }

  // Set user offline
  await user.setOnlineStatus(false);

  logger.auth('user_logged_out', user._id, {
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    allDevices: !refreshToken
  });

  successResponse(res, 'Logout successful');
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  successResponse(res, 'User profile retrieved successfully', {
    user: user.toPublicProfile()
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/me
// @access  Private
export const updateProfile = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const allowedFields = [
    'firstName', 'lastName', 'username', 'avatar',
    'timezone', 'preferences'
  ];

  const updates = {};

  // Only allow updates to specified fields
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Check if username is being changed and if it's already taken
  if (updates.username && updates.username !== req.user.username) {
    const existingUser = await User.findOne({ username: updates.username });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return next(new AppError('Username is already taken', 409));
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,
      runValidators: true
    }
  );

  logger.auth('profile_updated', user._id, {
    updatedFields: Object.keys(updates),
    ipAddress: req.ip
  });

  successResponse(res, 'Profile updated successfully', {
    user: user.toPublicProfile()
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
export const changePassword = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return unauthorizedResponse(res, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Remove all refresh tokens (force re-login on all devices)
  await user.removeAllRefreshTokens();

  logger.auth('password_changed', user._id, {
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  successResponse(res, 'Password changed successfully. Please log in again on all devices.');
});

// @desc    Request password reset
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if email exists or not for security
    return successResponse(res, 'If an account with that email exists, a password reset link has been sent.');
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // TODO: Send email with reset link
  // For now, just log it (in production, send actual email)
  logger.info('Password reset requested', {
    userId: user._id,
    email: user.email,
    resetToken,
    expiresAt: user.passwordResetExpires
  });

  successResponse(res, 'If an account with that email exists, a password reset link has been sent.');
});

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  const { token, newPassword } = req.body;

  try {
    // Verify reset token
    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded.type !== 'password_reset') {
      return next(new AppError('Invalid reset token', 400));
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.passwordResetToken || user.passwordResetToken !== token) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    if (user.passwordResetExpires < new Date()) {
      return next(new AppError('Reset token has expired', 400));
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Remove all refresh tokens
    await user.removeAllRefreshTokens();

    logger.auth('password_reset', user._id, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    successResponse(res, 'Password reset successfully. Please log in with your new password.');
  } catch (error) {
    return next(new AppError('Invalid reset token', 400));
  }
});

// @desc    Verify email
// @route   POST /api/v1/auth/verify-email
// @access  Public
export const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError('Verification token is required', 400));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded.type !== 'email_verification') {
      return next(new AppError('Invalid verification token', 400));
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.emailVerified) {
      return successResponse(res, 'Email already verified');
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.auth('email_verified', user._id, {
      email: user.email,
      ipAddress: req.ip
    });

    successResponse(res, 'Email verified successfully');
  } catch (error) {
    return next(new AppError('Invalid verification token', 400));
  }
});

// @desc    Resend email verification
// @route   POST /api/v1/auth/resend-verification
// @access  Private
export const resendVerification = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (user.emailVerified) {
    return successResponse(res, 'Email already verified');
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // TODO: Send verification email
  logger.info('Email verification resent', {
    userId: user._id,
    email: user.email,
    verificationToken
  });

  successResponse(res, 'Verification email sent successfully');
});