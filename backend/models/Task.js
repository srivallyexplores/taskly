import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        due: {
            type: Date,
            required: [true, "Due date is required"],
        },
        priority: {
            type: String,
            required: [true, "Priority is required"],
            enum: ["low", "medium", "high"], // Limited allowed values for priority
        },
        description: {
            type: String,
            trim: true,
        },
        tags: {
            type: [String],
            default: [], // Default empty array for tags
        },
        labels: {
            type: [String],
            validate: {
                validator: function (labels) {
                    return Array.isArray(labels) && labels.every(label => typeof label === "string");
                },
                message: "Labels must be an array of strings.",
            },
            default: [], // Default empty array for labels
        },
        status: {
            type: String,
            enum: ["in-progress", "failed", "completed"], // Ensure limited possible values for status
            default: "in-progress",
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Mongoose reference to User model
            required: true,
        },
        
        // Project and collaboration
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            default: null,
        },
        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        
        // Subtasks
        subtasks: [{
            title: {
                type: String,
                required: true,
                trim: true,
            },
            completed: {
                type: Boolean,
                default: false,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            completedAt: {
                type: Date,
                default: null,
            },
        }],
        
        // Rich content and attachments
        content: {
            type: String, // Rich text content (HTML/Markdown)
            default: "",
        },
        attachments: [{
            filename: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
            size: {
                type: Number,
                required: true,
            },
            type: {
                type: String,
                required: true,
            },
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
            uploadedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        }],
        
        // Time tracking
        estimatedTime: {
            type: Number, // in minutes
            default: 0,
        },
        actualTime: {
            type: Number, // in minutes
            default: 0,
        },
        timeEntries: [{
            startTime: {
                type: Date,
                required: true,
            },
            endTime: {
                type: Date,
                default: null,
            },
            duration: {
                type: Number, // in minutes
                default: 0,
            },
            description: {
                type: String,
                default: "",
            },
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        }],
        
        // Collaboration features
        comments: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            content: {
                type: String,
                required: true,
                trim: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            editedAt: {
                type: Date,
                default: null,
            },
        }],
        watchers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        
        // Recurring task configuration
        recurring: {
            enabled: {
                type: Boolean,
                default: false,
            },
            pattern: {
                type: String,
                enum: ['daily', 'weekly', 'monthly', 'yearly'],
                default: 'weekly',
            },
            interval: {
                type: Number,
                default: 1, // Every 1 week, 1 month, etc.
            },
            endDate: {
                type: Date,
                default: null,
            },
            nextDue: {
                type: Date,
                default: null,
            },
        },
        
        // Analytics and completion tracking
        completedAt: {
            type: Date,
            default: null,
        },
        completionTime: {
            type: Number, // Time taken to complete in minutes
            default: null,
        },
        
        // Task dependencies
        dependencies: [{
            task: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Task",
                required: true,
            },
            type: {
                type: String,
                enum: ['blocks', 'blocked_by', 'related'],
                default: 'blocks',
            },
        }],
        
        // Additional metadata
        category: {
            type: String,
            default: "general",
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },
        archived: {
            type: Boolean,
            default: false,
        },
        archivedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true } // Auto-handling createdAt and updatedAt fields
);

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
    if (this.status === 'completed') return false;
    return new Date() > new Date(this.due);
});

// Virtual for progress (based on subtasks)
taskSchema.virtual('progress').get(function() {
    if (this.subtasks.length === 0) return 0;
    const completed = this.subtasks.filter(st => st.completed).length;
    return Math.round((completed / this.subtasks.length) * 100);
});

// Pre-save hook for dynamic status update and analytics
taskSchema.pre("save", function (next) {
    const now = new Date();
    
    // Update completion analytics when task is completed
    if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
        this.completedAt = now;
        
        // Calculate completion time if we have creation date
        if (this.createdAt) {
            this.completionTime = Math.round((now - this.createdAt) / (1000 * 60)); // in minutes
        }
        
        // Update actual time from time entries
        this.actualTime = this.timeEntries.reduce((total, entry) => total + entry.duration, 0);
    }
    
    // Auto-update status based on due date (only if not manually set to completed)
    if (this.status !== "completed" && !this.isModified('status')) {
        this.status = this.due < now ? "failed" : "in-progress";
    }
    
    // Update recurring task next due date
    if (this.recurring.enabled && this.status === 'completed' && this.isModified('status')) {
        this.calculateNextDueDate();
    }

    next();
});

// Method to mark tasks as completed manually
taskSchema.methods.completeTask = function () {
    this.status = "completed";
    return this.save();
};

// Method to add time entry
taskSchema.methods.addTimeEntry = function (startTime, endTime, description = "", userId) {
    const duration = endTime ? Math.round((endTime - startTime) / (1000 * 60)) : 0;
    
    this.timeEntries.push({
        startTime,
        endTime,
        duration,
        description,
        user: userId,
    });
    
    // Update actual time
    this.actualTime = this.timeEntries.reduce((total, entry) => total + entry.duration, 0);
    
    return this.save();
};

// Method to complete subtask
taskSchema.methods.completeSubtask = function (subtaskId) {
    const subtask = this.subtasks.id(subtaskId);
    if (subtask) {
        subtask.completed = true;
        subtask.completedAt = new Date();
        
        // Check if all subtasks are completed
        const allCompleted = this.subtasks.every(st => st.completed);
        if (allCompleted && this.subtasks.length > 0) {
            this.status = 'completed';
        }
    }
    return this.save();
};

// Method to add comment
taskSchema.methods.addComment = function (userId, content) {
    this.comments.push({
        user: userId,
        content: content.trim(),
    });
    return this.save();
};

// Method to add watcher
taskSchema.methods.addWatcher = function (userId) {
    if (!this.watchers.includes(userId)) {
        this.watchers.push(userId);
    }
    return this.save();
};

// Method to calculate next due date for recurring tasks
taskSchema.methods.calculateNextDueDate = function () {
    if (!this.recurring.enabled) return;
    
    const currentDue = new Date(this.due);
    let nextDue = new Date(currentDue);
    
    switch (this.recurring.pattern) {
        case 'daily':
            nextDue.setDate(nextDue.getDate() + this.recurring.interval);
            break;
        case 'weekly':
            nextDue.setDate(nextDue.getDate() + (7 * this.recurring.interval));
            break;
        case 'monthly':
            nextDue.setMonth(nextDue.getMonth() + this.recurring.interval);
            break;
        case 'yearly':
            nextDue.setFullYear(nextDue.getFullYear() + this.recurring.interval);
            break;
    }
    
    // Check if we haven't exceeded the end date
    if (!this.recurring.endDate || nextDue <= this.recurring.endDate) {
        this.recurring.nextDue = nextDue;
    } else {
        this.recurring.enabled = false;
        this.recurring.nextDue = null;
    }
};

// Method to archive task
taskSchema.methods.archive = function () {
    this.archived = true;
    this.archivedAt = new Date();
    return this.save();
};

// Method to restore archived task
taskSchema.methods.restore = function () {
    this.archived = false;
    this.archivedAt = null;
    return this.save();
};

// Virtual for completion percentage based on subtasks
taskSchema.virtual('completionPercentage').get(function () {
    if (this.subtasks.length === 0) {
        return this.status === 'completed' ? 100 : 0;
    }
    
    const completedSubtasks = this.subtasks.filter(st => st.completed).length;
    return Math.round((completedSubtasks / this.subtasks.length) * 100);
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function () {
    return this.status !== 'completed' && new Date() > this.due;
});

// Virtual for time remaining
taskSchema.virtual('timeRemaining').get(function () {
    if (this.status === 'completed') return 0;
    const now = new Date();
    const remaining = this.due - now;
    return Math.max(0, Math.round(remaining / (1000 * 60 * 60 * 24))); // days remaining
});

// Ensure virtuals are included in JSON output
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model("Task", taskSchema);
export default Task;