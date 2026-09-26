import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
    },
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    avatar: {
        type: String,
        default:
            "https://res.cloudinary.com/dbdbod1wt/image/upload/v1751666550/placeholder-user_rbr3rs.png",
    },
    avatarPublicId: {
        type: String,
        default: null,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    tasks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
        },
    ],
    // User bio and profile information
    bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
        default: "",
    },
    timezone: {
        type: String,
        default: "UTC",
    },
    jobTitle: {
        type: String,
        default: "",
    },
    company: {
        type: String,
        default: "",
    },
    
    // Onboarding tracking
    onboarding: {
        completed: {
            type: Boolean,
            default: false,
        },
        currentStep: {
            type: Number,
            default: 0,
        },
        completedSteps: {
            type: [Number],
            default: [],
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    
    // User preferences
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system',
        },
        language: {
            type: String,
            default: 'en',
        },
        dateFormat: {
            type: String,
            enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
            default: 'MM/DD/YYYY',
        },
        timeFormat: {
            type: String,
            enum: ['12h', '24h'],
            default: '12h',
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            desktop: { type: Boolean, default: true },
            frequency: {
                type: String,
                enum: ['immediate', 'daily', 'weekly'],
                default: 'immediate',
            },
        },
        dashboard: {
            layout: {
                type: String,
                enum: ['default', 'compact', 'detailed'],
                default: 'default',
            },
            widgets: {
                type: [String],
                default: ['tasks-overview', 'productivity-chart', 'recent-activity', 'upcoming-deadlines'],
            },
        },
    },
    
    // Gamification fields
    level: {
        type: Number,
        default: 1,
        min: 1,
    },
    experience: {
        type: Number,
        default: 0,
        min: 0,
    },
    achievements: [{
        id: {
            type: String,
            required: true,
        },
        unlockedAt: {
            type: Date,
            default: Date.now,
        },
        progress: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },
    }],
    
    // Enhanced analytics and stats
    stats: {
        // Basic stats (existing)
        completed: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        ongoing: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        avgTime: { type: String, default: '0 hrs' },
        
        // New enhanced stats
        totalTasks: { type: Number, default: 0 },
        streakCurrent: { type: Number, default: 0 },
        streakLongest: { type: Number, default: 0 },
        averageCompletionTime: { type: Number, default: 0 }, // in minutes
        productivityScore: { type: Number, default: 0, min: 0, max: 100 },
        weeklyGoal: { type: Number, default: 5 },
        monthlyGoal: { type: Number, default: 20 },
        lastActiveDate: { type: Date, default: Date.now },
        
        // Time-based analytics
        dailyStats: [{
            date: { type: Date, required: true },
            tasksCompleted: { type: Number, default: 0 },
            timeSpent: { type: Number, default: 0 }, // in minutes
            productivityScore: { type: Number, default: 0 },
        }],
        
        // Category-based stats
        categoryStats: [{
            category: { type: String, required: true },
            completed: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
            averageTime: { type: Number, default: 0 },
        }],
    },
    
    // Team collaboration
    teams: [{
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            default: 'member',
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        permissions: {
            type: [String],
            default: ['read', 'create'],
        },
    }],
    
    // Password reset fields
    resetPasswordToken: {
        type: String,
        default: undefined,
    },
    resetPasswordExpires: {
        type: Date,
        default: undefined,
    },
});

// Pre-save hook for unique username validation and updated_at
userSchema.pre("save", async function (next) {
    try {
        // Update the updated_at field
        this.updated_at = new Date();
        
        if (!this.isModified('username') && !this.isNew) {
            return next();
        }

        const existingUser = await mongoose.model("User").findOne({
            username: this.username,
        });

        if (existingUser && existingUser._id.toString() !== this._id.toString()) {
            const error = new Error("The username is already taken.");
            error.statusCode = 400;
            return next(error);
        }
        next();
    } catch (err) {
        return next(err);
    }
});

// Method to calculate user level based on experience
userSchema.methods.calculateLevel = function() {
    // Level calculation: every 1000 XP = 1 level
    const newLevel = Math.floor(this.experience / 1000) + 1;
    if (newLevel !== this.level) {
        this.level = newLevel;
        return true; // Level up occurred
    }
    return false;
};

// Method to add experience points
userSchema.methods.addExperience = function(points) {
    this.experience += points;
    return this.calculateLevel();
};

// Method to update productivity score
userSchema.methods.updateProductivityScore = function() {
    const totalTasks = this.stats.totalTasks;
    const completedTasks = this.stats.completed;
    const streakBonus = Math.min(this.stats.streakCurrent * 2, 20); // Max 20 bonus points
    
    if (totalTasks === 0) {
        this.stats.productivityScore = 0;
        return;
    }
    
    const completionRate = (completedTasks / totalTasks) * 100;
    const baseScore = Math.min(completionRate, 80); // Max 80 from completion rate
    this.stats.productivityScore = Math.min(baseScore + streakBonus, 100);
};

// Method to update daily stats
userSchema.methods.updateDailyStats = function(date, tasksCompleted = 0, timeSpent = 0) {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    
    const existingDay = this.stats.dailyStats.find(day => 
        day.date.getTime() === today.getTime()
    );
    
    if (existingDay) {
        existingDay.tasksCompleted += tasksCompleted;
        existingDay.timeSpent += timeSpent;
        existingDay.productivityScore = this.stats.productivityScore;
    } else {
        this.stats.dailyStats.push({
            date: today,
            tasksCompleted,
            timeSpent,
            productivityScore: this.stats.productivityScore,
        });
        
        // Keep only last 90 days
        if (this.stats.dailyStats.length > 90) {
            this.stats.dailyStats.sort((a, b) => b.date - a.date);
            this.stats.dailyStats = this.stats.dailyStats.slice(0, 90);
        }
    }
};

// Indexes for search performance
// Note: username and email already have unique indexes from schema definition
userSchema.index({ fullname: 1 });
userSchema.index({ fullname: 'text', username: 'text', email: 'text' });

const User = mongoose.model("User", userSchema);
export default User;