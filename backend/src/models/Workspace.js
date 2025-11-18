import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Workspace schema definition
const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    maxlength: [100, 'Workspace name cannot exceed 100 characters'],
    minlength: [1, 'Workspace name cannot be empty']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ]
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Workspace must have an owner'],
    index: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'member'],
        message: 'Member role must be admin, manager, or member'
      },
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowGuestAccess: {
      type: Boolean,
      default: false
    },
    defaultTaskView: {
      type: String,
      enum: ['kanban', 'list', 'calendar'],
      default: 'kanban'
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00',
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      end: {
        type: String,
        default: '17:00',
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  branding: {
    primaryColor: {
      type: String,
      default: '#2563EB',
      match: /^#[0-9A-F]{6}$/i
    },
    logo: {
      type: String,
      default: null
    },
    coverImage: {
      type: String,
      default: null
    }
  },
  stats: {
    totalTasks: {
      type: Number,
      default: 0,
      min: 0
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0
    },
    activeMembers: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for member count
workspaceSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for completion rate
workspaceSchema.virtual('completionRate').get(function() {
  if (this.stats.totalTasks === 0) return 0;
  return Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100);
});

// Virtual for active status
workspaceSchema.virtual('isActive').get(function() {
  return !this.isArchived;
});

// Index definitions
workspaceSchema.index({ owner: 1, createdAt: -1 });
workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ slug: 1 }, { unique: true });
workspaceSchema.index({ isArchived: 1, updatedAt: -1 });
workspaceSchema.index({ 'stats.lastActivity': -1 });

// Pre-save middleware to generate slug
workspaceSchema.pre('save', async function(next) {
  if (this.isNew && !this.slug) {
    // Generate slug from name
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Ensure slug is not empty
    if (!baseSlug) baseSlug = 'workspace';

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness
    while (await mongoose.models.Workspace.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }

  next();
});

// Instance methods
workspaceSchema.methods = {
  // Add member to workspace
  async addMember(userId, role = 'member', invitedBy = null) {
    // Check if user is already a member
    const existingMember = this.members.find(
      member => member.user.toString() === userId.toString()
    );

    if (existingMember) {
      throw new Error('User is already a member of this workspace');
    }

    // Add member
    this.members.push({
      user: userId,
      role,
      invitedBy,
      invitedAt: new Date(),
      joinedAt: new Date()
    });

    // Update stats
    this.stats.activeMembers = this.members.length;
    this.stats.lastActivity = new Date();

    await this.save();

    logger.workspace('member_added', this._id, {
      userId,
      role,
      invitedBy: invitedBy?._id || invitedBy
    });

    return this.members[this.members.length - 1];
  },

  // Remove member from workspace
  async removeMember(userId, removedBy) {
    const memberIndex = this.members.findIndex(
      member => member.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      throw new Error('User is not a member of this workspace');
    }

    // Cannot remove owner
    if (this.owner.toString() === userId.toString()) {
      throw new Error('Cannot remove workspace owner');
    }

    // Remove member
    const removedMember = this.members.splice(memberIndex, 1)[0];

    // Update stats
    this.stats.activeMembers = this.members.length;
    this.stats.lastActivity = new Date();

    await this.save();

    logger.workspace('member_removed', this._id, {
      userId,
      removedBy: removedBy?._id || removedBy,
      role: removedMember.role
    });

    return removedMember;
  },

  // Update member role
  async updateMemberRole(userId, newRole, updatedBy) {
    const member = this.members.find(
      member => member.user.toString() === userId.toString()
    );

    if (!member) {
      throw new Error('User is not a member of this workspace');
    }

    // Cannot change owner's role
    if (this.owner.toString() === userId.toString()) {
      throw new Error('Cannot change workspace owner role');
    }

    const oldRole = member.role;
    member.role = newRole;

    this.stats.lastActivity = new Date();
    await this.save();

    logger.workspace('member_role_updated', this._id, {
      userId,
      oldRole,
      newRole,
      updatedBy: updatedBy?._id || updatedBy
    });

    return member;
  },

  // Check if user is member
  isMember(userId) {
    return this.members.some(
      member => member.user.toString() === userId.toString()
    );
  },

  // Check if user has specific role or higher
  hasRole(userId, requiredRole) {
    const member = this.members.find(
      member => member.user.toString() === userId.toString()
    );

    if (!member) return false;

    const roleHierarchy = { admin: 3, manager: 2, member: 1 };
    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  },

  // Get member role
  getMemberRole(userId) {
    const member = this.members.find(
      member => member.user.toString() === userId.toString()
    );
    return member ? member.role : null;
  },

  // Archive workspace
  async archive(archivedBy) {
    if (this.isArchived) {
      throw new Error('Workspace is already archived');
    }

    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = archivedBy;

    await this.save();

    logger.workspace('workspace_archived', this._id, {
      archivedBy: archivedBy?._id || archivedBy
    });

    return this;
  },

  // Unarchive workspace
  async unarchive(unarchivedBy) {
    if (!this.isArchived) {
      throw new Error('Workspace is not archived');
    }

    this.isArchived = false;
    this.archivedAt = undefined;
    this.archivedBy = undefined;

    await this.save();

    logger.workspace('workspace_unarchived', this._id, {
      unarchivedBy: unarchivedBy?._id || unarchivedBy
    });

    return this;
  },

  // Update task statistics
  async updateTaskStats() {
    // Import Task model dynamically to avoid circular dependencies
    const Task = (await import('./Task.js')).default;

    const stats = await Task.aggregate([
      { $match: { workspace: this._id, isArchived: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
          }
        }
      }
    ]);

    if (stats.length > 0) {
      this.stats.totalTasks = stats[0].totalTasks;
      this.stats.completedTasks = stats[0].completedTasks;
    } else {
      this.stats.totalTasks = 0;
      this.stats.completedTasks = 0;
    }

    await this.save({ validateBeforeSave: false });
  },

  // Get workspace public profile
  toPublicProfile(userId = null) {
    const profile = {
      _id: this._id,
      name: this.name,
      description: this.description,
      slug: this.slug,
      owner: this.owner,
      memberCount: this.memberCount,
      settings: {
        isPublic: this.settings.isPublic,
        defaultTaskView: this.settings.defaultTaskView
      },
      branding: this.branding,
      stats: this.stats,
      completionRate: this.completionRate,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    // Add member-specific information if user is provided
    if (userId) {
      const membership = this.members.find(
        member => member.user.toString() === userId.toString()
      );

      if (membership) {
        profile.membership = {
          role: membership.role,
          joinedAt: membership.joinedAt
        };
      }
    }

    return profile;
  }
};

// Static methods
workspaceSchema.statics = {
  // Find workspaces where user is member or owner
  async findUserWorkspaces(userId, includeArchived = false) {
    const matchCondition = {
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    };

    if (!includeArchived) {
      matchCondition.isArchived = { $ne: true };
    }

    return this.find(matchCondition)
      .populate('owner', 'firstName lastName email avatar')
      .populate('members.user', 'firstName lastName email avatar')
      .sort({ updatedAt: -1 });
  },

  // Find public workspaces
  async findPublicWorkspaces(limit = 20) {
    return this.find({
      'settings.isPublic': true,
      isArchived: { $ne: true }
    })
      .populate('owner', 'firstName lastName avatar')
      .limit(limit)
      .sort({ 'stats.lastActivity': -1 });
  },

  // Search workspaces by name or description
  async searchWorkspaces(query, userId = null, limit = 20) {
    const searchRegex = new RegExp(query, 'i');

    const matchCondition = {
      $and: [
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex }
          ]
        },
        {
          $or: [
            { owner: userId },
            { 'members.user': userId },
            { 'settings.isPublic': true }
          ]
        }
      ],
      isArchived: { $ne: true }
    };

    return this.find(matchCondition)
      .populate('owner', 'firstName lastName avatar')
      .limit(limit)
      .sort({ updatedAt: -1 });
  }
};

// Post-save middleware for logging
workspaceSchema.post('save', function(doc) {
  logger.database('workspace_saved', 'workspaces', {
    workspaceId: doc._id,
    name: doc.name,
    owner: doc.owner
  });
});

// Post-remove middleware for logging
workspaceSchema.post('remove', function(doc) {
  logger.database('workspace_removed', 'workspaces', {
    workspaceId: doc._id,
    name: doc.name,
    owner: doc.owner
  });
});

// Create and export the Workspace model
const Workspace = mongoose.model('Workspace', workspaceSchema);

export default Workspace;