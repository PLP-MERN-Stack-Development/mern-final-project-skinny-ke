import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Task schema definition
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters'],
    minlength: [1, 'Task title cannot be empty']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: ['todo', 'in-progress', 'review', 'done'],
      message: 'Status must be todo, in-progress, review, or done'
    },
    default: 'todo',
    index: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be low, medium, high, or urgent'
    },
    default: 'medium'
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Task must belong to a workspace'],
    index: true
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have a creator'],
    index: true
  },
  dueDate: {
    type: Date,
    index: true
  },
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative'],
    max: [1000, 'Estimated hours cannot exceed 1000']
  },
  actualHours: {
    type: Number,
    min: [0, 'Actual hours cannot be negative'],
    max: [1000, 'Actual hours cannot exceed 1000']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
    lowercase: true,
    index: true
  }],
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Subtask title cannot exceed 200 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  activity: [{
    type: {
      type: String,
      enum: [
        'created', 'updated', 'status_changed', 'priority_changed',
        'assigned', 'unassigned', 'due_date_changed', 'comment_added',
        'attachment_added', 'subtask_added', 'subtask_completed'
      ],
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  position: {
    type: Number,
    default: 0,
    index: true
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

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.subtasks.length === 0) {
    return this.status === 'done' ? 100 : 0;
  }

  const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length;
  return Math.round((completedSubtasks / this.subtasks.length) * 100);
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'done') return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;

  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
});

// Virtual for time tracking completion
taskSchema.virtual('timeTrackingCompletion').get(function() {
  if (!this.estimatedHours || this.actualHours === undefined) return null;
  if (this.actualHours === 0) return 0;

  const completion = (this.actualHours / this.estimatedHours) * 100;
  return Math.min(Math.round(completion), 200); // Cap at 200% for overtime
});

// Index definitions
taskSchema.index({ workspace: 1, status: 1, createdAt: -1 });
taskSchema.index({ workspace: 1, assignees: 1 });
taskSchema.index({ workspace: 1, dueDate: 1 });
taskSchema.index({ workspace: 1, priority: 1 });
taskSchema.index({ workspace: 1, tags: 1 });
taskSchema.index({ workspace: 1, position: 1 });
taskSchema.index({ workspace: 1, isArchived: 1 });
taskSchema.index({ createdBy: 1, createdAt: -1 });
taskSchema.index({ 'activity.timestamp': -1 });

// Pre-save middleware
taskSchema.pre('save', async function(next) {
  // Auto-update workspace stats when task is saved
  if (this.isModified() && !this.isNew) {
    try {
      // Import Workspace model dynamically to avoid circular dependencies
      const Workspace = (await import('./Workspace.js')).default;

      // Update workspace task stats
      setTimeout(async () => {
        try {
          await Workspace.findByIdAndUpdate(this.workspace, {
            'stats.lastActivity': new Date()
          });
        } catch (error) {
          logger.error('Failed to update workspace activity:', error);
        }
      }, 0);
    } catch (error) {
      logger.error('Workspace stats update error:', error);
    }
  }

  next();
});

// Instance methods
taskSchema.methods = {
  // Add assignee
  async addAssignee(userId, addedBy) {
    if (this.assignees.includes(userId)) {
      throw new Error('User is already assigned to this task');
    }

    this.assignees.push(userId);
    await this.logActivity('assigned', addedBy, { assigneeId: userId });
    await this.save();

    return this;
  },

  // Remove assignee
  async removeAssignee(userId, removedBy) {
    const index = this.assignees.indexOf(userId);
    if (index === -1) {
      throw new Error('User is not assigned to this task');
    }

    this.assignees.splice(index, 1);
    await this.logActivity('unassigned', removedBy, { assigneeId: userId });
    await this.save();

    return this;
  },

  // Update status
  async updateStatus(newStatus, updatedBy) {
    const oldStatus = this.status;
    this.status = newStatus;

    await this.logActivity('status_changed', updatedBy, {}, oldStatus, newStatus);
    await this.save();

    // Update workspace stats
    try {
      const Workspace = (await import('./Workspace.js')).default;
      await Workspace.findById(this.workspace).then(workspace => {
        if (workspace) workspace.updateTaskStats();
      });
    } catch (error) {
      logger.error('Failed to update workspace stats:', error);
    }

    return this;
  },

  // Update priority
  async updatePriority(newPriority, updatedBy) {
    const oldPriority = this.priority;
    this.priority = newPriority;

    await this.logActivity('priority_changed', updatedBy, {}, oldPriority, newPriority);
    await this.save();

    return this;
  },

  // Update due date
  async updateDueDate(newDueDate, updatedBy) {
    const oldDueDate = this.dueDate;
    this.dueDate = newDueDate;

    await this.logActivity('due_date_changed', updatedBy, {}, oldDueDate, newDueDate);
    await this.save();

    return this;
  },

  // Add subtask
  async addSubtask(title, assignedTo = null, addedBy) {
    const subtask = {
      title,
      assignedTo,
      createdAt: new Date()
    };

    this.subtasks.push(subtask);
    await this.logActivity('subtask_added', addedBy, { subtaskTitle: title, assignedTo });
    await this.save();

    return this.subtasks[this.subtasks.length - 1];
  },

  // Complete subtask
  async completeSubtask(subtaskId, completedBy) {
    const subtask = this.subtasks.id(subtaskId);
    if (!subtask) {
      throw new Error('Subtask not found');
    }

    subtask.completed = true;
    subtask.completedAt = new Date();

    await this.logActivity('subtask_completed', completedBy, { subtaskId, subtaskTitle: subtask.title });
    await this.save();

    return subtask;
  },

  // Add attachment
  async addAttachment(attachment, uploadedBy) {
    this.attachments.push({
      ...attachment,
      uploadedBy,
      uploadedAt: new Date()
    });

    await this.logActivity('attachment_added', uploadedBy, {
      filename: attachment.filename,
      size: attachment.size
    });
    await this.save();

    return this.attachments[this.attachments.length - 1];
  },

  // Log activity
  async logActivity(type, user, details = {}, previousValue = null, newValue = null) {
    const activity = {
      type,
      user,
      timestamp: new Date(),
      details,
      previousValue,
      newValue
    };

    this.activity.push(activity);

    // Keep only last 100 activities
    if (this.activity.length > 100) {
      this.activity = this.activity.slice(-100);
    }

    await this.save({ validateBeforeSave: false });
  },

  // Archive task
  async archive(archivedBy) {
    if (this.isArchived) {
      throw new Error('Task is already archived');
    }

    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = archivedBy;

    await this.save();

    // Update workspace stats
    try {
      const Workspace = (await import('./Workspace.js')).default;
      await Workspace.findById(this.workspace).then(workspace => {
        if (workspace) workspace.updateTaskStats();
      });
    } catch (error) {
      logger.error('Failed to update workspace stats:', error);
    }

    return this;
  },

  // Unarchive task
  async unarchive(unarchivedBy) {
    if (!this.isArchived) {
      throw new Error('Task is not archived');
    }

    this.isArchived = false;
    this.archivedAt = undefined;
    this.archivedBy = undefined;

    await this.save();

    return this;
  },

  // Check if user can access this task
  async canAccess(userId) {
    // Import Workspace model dynamically
    const Workspace = (await import('./Workspace.js')).default;

    const workspace = await Workspace.findById(this.workspace);
    return workspace && workspace.isMember(userId);
  },

  // Get task with populated references
  async toDetailedJSON(userId = null) {
    await this.populate([
      { path: 'workspace', select: 'name slug' },
      { path: 'assignees', select: 'firstName lastName email avatar' },
      { path: 'createdBy', select: 'firstName lastName email avatar' },
      { path: 'comments', populate: { path: 'author', select: 'firstName lastName avatar' } },
      { path: 'activity.user', select: 'firstName lastName avatar' }
    ]);

    const task = this.toObject();

    // Add computed fields
    task.completionPercentage = this.completionPercentage;
    task.isOverdue = this.isOverdue;
    task.daysUntilDue = this.daysUntilDue;
    task.timeTrackingCompletion = this.timeTrackingCompletion;

    // Add user-specific information
    if (userId) {
      task.isAssigned = this.assignees.some(assignee =>
        assignee._id.toString() === userId.toString()
      );
    }

    return task;
  }
};

// Static methods
taskSchema.statics = {
  // Find tasks by workspace
  async findByWorkspace(workspaceId, filters = {}, options = {}) {
    const query = { workspace: workspaceId, isArchived: { $ne: true } };

    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assignee) query.assignees = filters.assignee;
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    if (filters.dueDateRange) {
      query.dueDate = {
        $gte: filters.dueDateRange.start,
        $lte: filters.dueDateRange.end
      };
    }
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') }
      ];
    }

    // Apply options
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

    const tasks = await this.find(query)
      .populate('assignees', 'firstName lastName avatar')
      .populate('createdBy', 'firstName lastName avatar')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await this.countDocuments(query);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Find overdue tasks
  async findOverdue(workspaceId) {
    return this.find({
      workspace: workspaceId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
      isArchived: { $ne: true }
    })
    .populate('assignees', 'firstName lastName email')
    .sort({ dueDate: 1 });
  },

  // Find tasks due today
  async findDueToday(workspaceId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.find({
      workspace: workspaceId,
      dueDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'done' },
      isArchived: { $ne: true }
    })
    .populate('assignees', 'firstName lastName email')
    .sort({ dueDate: 1 });
  },

  // Get workspace task statistics
  async getWorkspaceStats(workspaceId) {
    const stats = await this.aggregate([
      { $match: { workspace: workspaceId, isArchived: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'done'] },
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$dueDate', null] }
                  ]
                },
                1,
                0
              ]
            }
          },
          byStatus: {
            $push: '$status'
          },
          byPriority: {
            $push: '$priority'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        byStatus: {},
        byPriority: {}
      };
    }

    const result = stats[0];
    result.completionRate = result.totalTasks > 0
      ? Math.round((result.completedTasks / result.totalTasks) * 100)
      : 0;

    // Count by status
    result.byStatus = result.byStatus.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Count by priority
    result.byPriority = result.byPriority.reduce((acc, priority) => {
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return result;
  }
};

// Post-save middleware for logging
taskSchema.post('save', function(doc) {
  logger.database('task_saved', 'tasks', {
    taskId: doc._id,
    title: doc.title,
    workspace: doc.workspace,
    status: doc.status
  });
});

// Post-remove middleware for logging
taskSchema.post('remove', function(doc) {
  logger.database('task_removed', 'tasks', {
    taskId: doc._id,
    title: doc.title,
    workspace: doc.workspace
  });
});

// Create and export the Task model
const Task = mongoose.model('Task', taskSchema);

export default Task;