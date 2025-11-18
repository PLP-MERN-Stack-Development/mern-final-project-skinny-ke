import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import realtimeService from '../services/realtimeService.js';

// Comment schema definition
const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    minlength: [1, 'Comment cannot be empty']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must have an author'],
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Comment must belong to a task'],
    index: true
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true,
      maxlength: [10, 'Emoji cannot exceed 10 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reaction count by emoji
commentSchema.virtual('reactionSummary').get(function() {
  const summary = {};
  this.reactions.forEach(reaction => {
    if (!summary[reaction.emoji]) {
      summary[reaction.emoji] = { count: 0, users: [] };
    }
    summary[reaction.emoji].count++;
    summary[reaction.emoji].users.push(reaction.user);
  });
  return summary;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Index definitions
commentSchema.index({ task: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ mentions: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isDeleted: 1, createdAt: -1 });

// Pre-save middleware
commentSchema.pre('save', async function(next) {
  // Extract mentions from content
  if (this.isModified('content') && !this.isDeleted) {
    const mentionRegex = /@\[([^\]]+)\]\((\w+)\)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(this.content)) !== null) {
      // match[2] contains the user ID
      if (match[2] && mongoose.Types.ObjectId.isValid(match[2])) {
        mentions.push(match[2]);
      }
    }

    this.mentions = [...new Set(mentions)]; // Remove duplicates
  }

  next();
});

// Instance methods
commentSchema.methods = {
  // Add reaction
  async addReaction(userId, emoji) {
    // Check if user already reacted with this emoji
    const existingReaction = this.reactions.find(
      reaction => reaction.user.toString() === userId.toString() && reaction.emoji === emoji
    );

    if (existingReaction) {
      throw new Error('User has already reacted with this emoji');
    }

    this.reactions.push({
      user: userId,
      emoji,
      createdAt: new Date()
    });

    await this.save();
    return this.reactions[this.reactions.length - 1];
  },

  // Remove reaction
  async removeReaction(userId, emoji) {
    const reactionIndex = this.reactions.findIndex(
      reaction => reaction.user.toString() === userId.toString() && reaction.emoji === emoji
    );

    if (reactionIndex === -1) {
      throw new Error('Reaction not found');
    }

    this.reactions.splice(reactionIndex, 1);
    await this.save();
    return true;
  },

  // Edit comment
  async edit(newContent, editedBy) {
    if (this.isDeleted) {
      throw new Error('Cannot edit deleted comment');
    }

    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
    this.editedBy = editedBy;

    await this.save();
    return this;
  },

  // Soft delete comment
  async softDelete(deletedBy) {
    if (this.isDeleted) {
      throw new Error('Comment is already deleted');
    }

    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;

    // Clear sensitive content
    this.content = '[This comment has been deleted]';
    this.mentions = [];
    this.attachments = [];
    this.reactions = [];

    await this.save();
    return this;
  },

  // Add reply
  async addReply(replyId) {
    if (!this.replies.includes(replyId)) {
      this.replies.push(replyId);
      await this.save();
    }
    return this;
  },

  // Remove reply
  async removeReply(replyId) {
    this.replies = this.replies.filter(id => id.toString() !== replyId.toString());
    await this.save();
    return this;
  },

  // Add attachment
  async addAttachment(attachment) {
    this.attachments.push({
      ...attachment,
      uploadedAt: new Date()
    });

    await this.save();
    return this.attachments[this.attachments.length - 1];
  },

  // Get comment with populated references
  async toDetailedJSON(userId = null) {
    await this.populate([
      { path: 'author', select: 'firstName lastName email avatar' },
      { path: 'mentions', select: 'firstName lastName username' },
      { path: 'reactions.user', select: 'firstName lastName avatar' },
      { path: 'editedBy', select: 'firstName lastName' },
      { path: 'replies', select: '_id author createdAt' }
    ]);

    const comment = this.toObject();

    // Add computed fields
    comment.reactionSummary = this.reactionSummary;
    comment.replyCount = this.replyCount;

    // Add user-specific information
    if (userId) {
      comment.userReactions = this.reactions
        .filter(reaction => reaction.user._id.toString() === userId.toString())
        .map(reaction => reaction.emoji);
    }

    return comment;
  }
};

// Static methods
commentSchema.statics = {
  // Find comments by task
  async findByTask(taskId, options = {}) {
    const { page = 1, limit = 20, includeDeleted = false } = options;

    const query = { task: taskId, parentComment: null }; // Only top-level comments

    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    const comments = await this.find(query)
      .populate('author', 'firstName lastName email avatar')
      .populate('mentions', 'firstName lastName username')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'firstName lastName avatar' }
      })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await this.countDocuments(query);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Find replies to a comment
  async findReplies(commentId, options = {}) {
    const { page = 1, limit = 20, includeDeleted = false } = options;

    const query = { parentComment: commentId };

    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    const replies = await this.find(query)
      .populate('author', 'firstName lastName email avatar')
      .populate('mentions', 'firstName lastName username')
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await this.countDocuments(query);

    return {
      replies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Search comments by content
  async searchComments(taskId, searchTerm, options = {}) {
    const { page = 1, limit = 20, includeDeleted = false } = options;

    const query = {
      task: taskId,
      content: new RegExp(searchTerm, 'i'),
      isDeleted: includeDeleted ? { $exists: true } : { $ne: true }
    };

    const comments = await this.find(query)
      .populate('author', 'firstName lastName email avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await this.countDocuments(query);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Get comment statistics for a task
  async getTaskCommentStats(taskId) {
    const stats = await this.aggregate([
      { $match: { task: taskId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalComments: { $sum: 1 },
          totalReactions: { $sum: { $size: '$reactions' } },
          totalAttachments: { $sum: { $size: '$attachments' } },
          uniqueAuthors: { $addToSet: '$author' }
        }
      },
      {
        $project: {
          totalComments: 1,
          totalReactions: 1,
          totalAttachments: 1,
          uniqueAuthorsCount: { $size: '$uniqueAuthors' }
        }
      }
    ]);

    return stats.length > 0 ? stats[0] : {
      totalComments: 0,
      totalReactions: 0,
      totalAttachments: 0,
      uniqueAuthorsCount: 0
    };
  }
};

// Post-save middleware for logging
commentSchema.post('save', function(doc) {
  logger.database('comment_saved', 'comments', {
    commentId: doc._id,
    taskId: doc.task,
    author: doc.author,
    isDeleted: doc.isDeleted
  });
});

// Post-remove middleware for logging
commentSchema.post('remove', function(doc) {
  logger.database('comment_removed', 'comments', {
    commentId: doc._id,
    taskId: doc.task,
    author: doc.author
  });
});

// Real-time broadcasting methods
commentSchema.methods.broadcastCreate = async function(createdBy) {
  try {
    const task = await mongoose.model('Task').findById(this.task);
    if (task) {
      realtimeService.broadcastToWorkspace(task.workspace.toString(), 'comment:created', {
        comment: await this.toDetailedJSON(),
        taskId: this.task,
        createdBy,
        timestamp: new Date()
      });
    }
  } catch (error) {
    logger.error('Error broadcasting comment creation:', error);
  }
};

commentSchema.methods.broadcastUpdate = async function(updatedBy) {
  try {
    const task = await mongoose.model('Task').findById(this.task);
    if (task) {
      realtimeService.broadcastToWorkspace(task.workspace.toString(), 'comment:updated', {
        comment: await this.toDetailedJSON(),
        taskId: this.task,
        updatedBy,
        timestamp: new Date()
      });
    }
  } catch (error) {
    logger.error('Error broadcasting comment update:', error);
  }
};

commentSchema.methods.broadcastDelete = async function(deletedBy) {
  try {
    const task = await mongoose.model('Task').findById(this.task);
    if (task) {
      realtimeService.broadcastToWorkspace(task.workspace.toString(), 'comment:deleted', {
        commentId: this._id,
        taskId: this.task,
        deletedBy,
        timestamp: new Date()
      });
    }
  } catch (error) {
    logger.error('Error broadcasting comment deletion:', error);
  }
};

commentSchema.methods.broadcastReaction = async function(userId, emoji, action) {
  try {
    const task = await mongoose.model('Task').findById(this.task);
    if (task) {
      realtimeService.broadcastToWorkspace(task.workspace.toString(), 'comment:reaction', {
        commentId: this._id,
        taskId: this.task,
        reaction: { user: userId, emoji, action },
        timestamp: new Date()
      });
    }
  } catch (error) {
    logger.error('Error broadcasting comment reaction:', error);
  }
};

// Create and export the Comment model
const Comment = mongoose.model('Comment', commentSchema);

export default Comment;