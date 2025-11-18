import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// User schema definition
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ]
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'manager', 'member'],
      message: 'Role must be either admin, manager, or member'
    },
    default: 'member'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    userAgent: String,
    ipAddress: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  let completed = 0;
  const total = 4; // email, username, firstName, lastName

  if (this.email) completed++;
  if (this.username) completed++;
  if (this.firstName) completed++;
  if (this.lastName) completed++;
  if (this.avatar) completed++; // bonus point for avatar
  if (this.emailVerified) completed++; // bonus point for verification

  return Math.min(Math.round((completed / (total + 2)) * 100), 100);
});

// Index definitions
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ lastActive: 1 });
userSchema.index({ 'refreshTokens.token': 1 });
userSchema.index({ emailVerificationExpires: 1 }, { expireAfterSeconds: 0 });
userSchema.index({ passwordResetExpires: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    logger.error('Password hashing error:', error);
    next(error);
  }
});

// Instance methods
userSchema.methods = {
  // Compare password for login
  async comparePassword(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      logger.error('Password comparison error:', error);
      throw error;
    }
  },

  // Generate JWT access token
  generateAccessToken() {
    return jwt.sign(
      {
        userId: this._id,
        email: this.email,
        role: this.role
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expire,
        issuer: 'collabtask-api',
        audience: 'collabtask-users'
      }
    );
  },

  // Generate JWT refresh token
  generateRefreshToken() {
    return jwt.sign(
      {
        userId: this._id,
        type: 'refresh'
      },
      config.jwt.refreshSecret,
      {
        expiresIn: config.jwt.refreshExpire,
        issuer: 'collabtask-api',
        audience: 'collabtask-users'
      }
    );
  },

  // Add refresh token to user
  async addRefreshToken(token, userAgent = '', ipAddress = '') {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    this.refreshTokens.push({
      token,
      expiresAt,
      userAgent,
      ipAddress
    });

    // Keep only last 5 refresh tokens
    if (this.refreshTokens.length > 5) {
      this.refreshTokens = this.refreshTokens.slice(-5);
    }

    await this.save();
    logger.auth('refresh_token_added', this._id, { ipAddress, userAgent });
  },

  // Remove refresh token
  async removeRefreshToken(token) {
    this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
    await this.save();
    logger.auth('refresh_token_removed', this._id);
  },

  // Remove all refresh tokens (logout from all devices)
  async removeAllRefreshTokens() {
    this.refreshTokens = [];
    await this.save();
    logger.auth('all_refresh_tokens_removed', this._id);
  },

  // Update last active timestamp
  async updateLastActive() {
    this.lastActive = new Date();
    await this.save({ validateBeforeSave: false });
  },

  // Set online status
  async setOnlineStatus(status) {
    this.isOnline = status;
    if (status) {
      this.lastActive = new Date();
    }
    await this.save({ validateBeforeSave: false });
  },

  // Generate email verification token
  generateEmailVerificationToken() {
    const verificationToken = jwt.sign(
      { userId: this._id, type: 'email_verification' },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    this.emailVerificationToken = verificationToken;
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return verificationToken;
  },

  // Generate password reset token
  generatePasswordResetToken() {
    const resetToken = jwt.sign(
      { userId: this._id, type: 'password_reset' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    this.passwordResetToken = resetToken;
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return resetToken;
  },

  // Get user public profile (without sensitive data)
  toPublicProfile() {
    return {
      _id: this._id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      avatar: this.avatar,
      role: this.role,
      preferences: this.preferences,
      lastActive: this.lastActive,
      isOnline: this.isOnline,
      timezone: this.timezone,
      emailVerified: this.emailVerified,
      profileCompletion: this.profileCompletion,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
};

// Static methods
userSchema.statics = {
  // Find user by email or username
  async findByEmailOrUsername(identifier) {
    return this.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });
  },

  // Find user by refresh token
  async findByRefreshToken(token) {
    return this.findOne({
      'refreshTokens.token': token,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });
  },

  // Clean expired refresh tokens (run periodically)
  async cleanExpiredRefreshTokens() {
    const result = await this.updateMany(
      {},
      {
        $pull: {
          refreshTokens: {
            expiresAt: { $lt: new Date() }
          }
        }
      }
    );

    logger.info(`Cleaned ${result.modifiedCount} expired refresh tokens`);
    return result;
  }
};

// Post-save middleware for logging
userSchema.post('save', function(doc) {
  logger.database('user_saved', 'users', { userId: doc._id, email: doc.email });
});

// Post-remove middleware for logging
userSchema.post('remove', function(doc) {
  logger.database('user_removed', 'users', { userId: doc._id, email: doc.email });
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

export default User;