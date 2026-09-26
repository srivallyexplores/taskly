import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Achievement name is required"],
            trim: true,
            maxlength: [100, "Achievement name cannot exceed 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Achievement description is required"],
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        icon: {
            type: String,
            required: true,
            default: "trophy",
        },
        category: {
            type: String,
            required: true,
            enum: [
                'productivity', 
                'consistency', 
                'collaboration', 
                'milestone', 
                'special', 
                'streak', 
                'completion',
                'time-management',
                'social'
            ],
            default: 'productivity',
        },
        
        // Achievement rarity and points
        rarity: {
            type: String,
            enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
            default: 'common',
        },
        points: {
            type: Number,
            required: true,
            min: [1, "Achievement must award at least 1 point"],
            max: [1000, "Achievement cannot award more than 1000 points"],
            default: 10,
        },
        
        // Unlock conditions
        conditions: {
            type: {
                type: String,
                required: true,
                enum: [
                    'task_count',           // Complete X tasks
                    'streak_days',          // Maintain streak for X days
                    'completion_rate',      // Achieve X% completion rate
                    'time_saved',          // Save X minutes through efficiency
                    'collaboration',       // Work with X team members
                    'consistency',         // Complete tasks X days in a row
                    'speed',              // Complete task in under X minutes
                    'milestone',          // Reach specific milestone
                    'special_date',       // Complete on special date
                    'category_master',    // Master specific category
                    'combo'               // Multiple conditions
                ],
            },
            target: {
                type: Number,
                required: true,
                min: 1,
            },
            timeframe: {
                type: String,
                enum: ['daily', 'weekly', 'monthly', 'yearly', 'all-time'],
                default: 'all-time',
            },
            // For combo achievements
            subConditions: [{
                type: {
                    type: String,
                    enum: [
                        'task_count',
                        'streak_days',
                        'completion_rate',
                        'time_saved',
                        'collaboration',
                        'consistency',
                        'speed',
                        'milestone'
                    ],
                },
                target: Number,
                timeframe: {
                    type: String,
                    enum: ['daily', 'weekly', 'monthly', 'yearly', 'all-time'],
                    default: 'all-time',
                },
            }],
        },
        
        // Achievement metadata
        isActive: {
            type: Boolean,
            default: true,
        },
        isSecret: {
            type: Boolean,
            default: false, // Secret achievements are hidden until unlocked
        },
        order: {
            type: Number,
            default: 0, // For sorting achievements
        },
        
        // Unlock statistics
        stats: {
            totalUnlocks: {
                type: Number,
                default: 0,
            },
            firstUnlockedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null,
            },
            firstUnlockedAt: {
                type: Date,
                default: null,
            },
            lastUnlockedAt: {
                type: Date,
                default: null,
            },
        },
        
        // Achievement series (for related achievements)
        series: {
            name: {
                type: String,
                default: null,
            },
            order: {
                type: Number,
                default: 1,
            },
        },
        
        // Seasonal or time-limited achievements
        availability: {
            startDate: {
                type: Date,
                default: null,
            },
            endDate: {
                type: Date,
                default: null,
            },
            isLimited: {
                type: Boolean,
                default: false,
            },
        },
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes for performance
achievementSchema.index({ id: 1 });
achievementSchema.index({ category: 1, rarity: 1 });
achievementSchema.index({ isActive: 1, isSecret: 1 });
achievementSchema.index({ 'availability.startDate': 1, 'availability.endDate': 1 });

// Virtual for unlock rate
achievementSchema.virtual('unlockRate').get(function () {
    // This would need to be calculated based on total users
    // For now, return a placeholder
    return 0;
});

// Virtual for availability status
achievementSchema.virtual('isAvailable').get(function () {
    if (!this.availability.isLimited) return true;
    
    const now = new Date();
    const start = this.availability.startDate;
    const end = this.availability.endDate;
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    
    return true;
});

// Method to check if user meets conditions
achievementSchema.methods.checkConditions = function (userStats, userAchievements = []) {
    if (!this.isActive || !this.isAvailable) return false;
    
    // Check if already unlocked
    if (userAchievements.some(a => a.id === this.id)) return false;
    
    const { type, target, timeframe } = this.conditions;
    
    switch (type) {
        case 'task_count':
            return this.checkTaskCount(userStats, target, timeframe);
        case 'streak_days':
            return userStats.streakCurrent >= target;
        case 'completion_rate':
            return userStats.completionRate >= target;
        case 'collaboration':
            return userStats.collaborations >= target;
        case 'consistency':
            return userStats.consistentDays >= target;
        case 'combo':
            return this.checkComboConditions(userStats, userAchievements);
        default:
            return false;
    }
};

// Helper method to check task count conditions
achievementSchema.methods.checkTaskCount = function (userStats, target, timeframe) {
    switch (timeframe) {
        case 'daily':
            return userStats.tasksCompletedToday >= target;
        case 'weekly':
            return userStats.tasksCompletedThisWeek >= target;
        case 'monthly':
            return userStats.tasksCompletedThisMonth >= target;
        case 'yearly':
            return userStats.tasksCompletedThisYear >= target;
        case 'all-time':
        default:
            return userStats.totalCompleted >= target;
    }
};

// Helper method to check combo conditions
achievementSchema.methods.checkComboConditions = function (userStats, userAchievements) {
    if (!this.conditions.subConditions || this.conditions.subConditions.length === 0) {
        return false;
    }
    
    return this.conditions.subConditions.every(condition => {
        switch (condition.type) {
            case 'task_count':
                return this.checkTaskCount(userStats, condition.target, condition.timeframe);
            case 'streak_days':
                return userStats.streakCurrent >= condition.target;
            case 'completion_rate':
                return userStats.completionRate >= condition.target;
            default:
                return false;
        }
    });
};

// Method to unlock achievement for user
achievementSchema.methods.unlock = function (userId) {
    this.stats.totalUnlocks += 1;
    this.stats.lastUnlockedAt = new Date();
    
    if (!this.stats.firstUnlockedBy) {
        this.stats.firstUnlockedBy = userId;
        this.stats.firstUnlockedAt = new Date();
    }
    
    return this.save();
};

// Static method to get available achievements
achievementSchema.statics.getAvailable = function () {
    const now = new Date();
    return this.find({
        isActive: true,
        $or: [
            { 'availability.isLimited': false },
            {
                'availability.isLimited': true,
                $and: [
                    { $or: [{ 'availability.startDate': null }, { 'availability.startDate': { $lte: now } }] },
                    { $or: [{ 'availability.endDate': null }, { 'availability.endDate': { $gte: now } }] }
                ]
            }
        ]
    }).sort({ category: 1, order: 1, rarity: 1 });
};

// Static method to get achievements by category
achievementSchema.statics.getByCategory = function (category) {
    return this.find({
        category,
        isActive: true
    }).sort({ order: 1, rarity: 1 });
};

// Static method to check and unlock achievements for user
achievementSchema.statics.checkAndUnlock = async function (userId, userStats, userAchievements = []) {
    const availableAchievements = await this.getAvailable();
    const newlyUnlocked = [];
    
    for (const achievement of availableAchievements) {
        if (achievement.checkConditions(userStats, userAchievements)) {
            await achievement.unlock(userId);
            newlyUnlocked.push(achievement);
        }
    }
    
    return newlyUnlocked;
};

const Achievement = mongoose.model("Achievement", achievementSchema);
export default Achievement;