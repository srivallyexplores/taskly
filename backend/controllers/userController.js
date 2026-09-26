import User from '../models/User.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import Invitation from '../models/Invitation.js';
import { calculateProductivityStats } from '../utils/productivityStats.js';
import { comparePassword, hashPassword } from '../utils/password.js';

/**
 * Get user by ID with tasks and statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const perPage = parseInt(req.query.limit, 10) || 8;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Get total task count for pagination
        const totalTasks = await Task.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalTasks / perPage);

        // Fetch paginated tasks
        const rawTasks = await Task.find({ user: userId })
            .populate('assignee', 'fullname username email avatar')
            .populate('user', 'fullname username email avatar')
            .populate('project', 'name description')
            .populate('team', 'name')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort({ due: 1 });

        // Evaluate dynamic task status
        const tasks = rawTasks.map(task => {
            const now = new Date();
            const dueDate = task.due;
            let dynamicStatus = task.status;

            if (dynamicStatus === "in-progress") {
                dynamicStatus = dueDate < now ? "failed" : "in-progress";
            }

            return {
                ...task._doc,
                dynamicStatus
            };
        });

        // Calculate productivity stats
        const stats = await calculateProductivityStats(userId);

        // Remove password from user response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            data: {
                user: userResponse,
                tasks,
                stats,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalTasks,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                    perPage
                }
            },
            message: 'User retrieved successfully'
        });

    } catch (error) {
        //console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve user',
                code: 'USER_FETCH_ERROR'
            }
        });
    }
};

/**
 * Get all users with pagination and statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const perPage = parseInt(req.query.limit, 10) || 12;
        const search = req.query.search || '';

        // Build search query
        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { fullname: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Get total user count
        const totalUsers = await User.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalUsers / perPage);

        // Fetch users for the current page
        const users = await User.find(searchQuery)
            .populate('tasks', 'title due status')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort({ created_at: -1 });

        // Calculate stats for each user and remove passwords
        const usersWithStats = await Promise.all(users.map(async user => {
            const stats = await calculateProductivityStats(user._id);
            const userObj = user.toObject();
            delete userObj.password;
            
            return {
                ...userObj,
                stats,
                totalTasks: user.tasks.length
            };
        }));

        res.json({
            success: true,
            data: {
                users: usersWithStats,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalUsers,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                    perPage
                }
            },
            message: 'Users retrieved successfully'
        });

    } catch (error) {
        //console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve users',
                code: 'USERS_FETCH_ERROR'
            }
        });
    }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullname, username, email, avatar, currentPassword, newPassword } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Check authorization - users can only update their own profile or admin can update any
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to update this user',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // If changing password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Current password is required to set new password',
                        code: 'CURRENT_PASSWORD_REQUIRED'
                    }
                });
            }

            const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Current password is incorrect',
                        code: 'INVALID_CURRENT_PASSWORD'
                    }
                });
            }

            user.password = await hashPassword(newPassword);
        }

        // Update other fields
        if (fullname !== undefined) user.fullname = fullname;
        if (username !== undefined) user.username = username;
        if (email !== undefined) user.email = email;
        if (avatar !== undefined) user.avatar = avatar;

        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            data: {
                user: userResponse
            },
            message: 'User updated successfully'
        });

    } catch (error) {
        //console.error('Error updating user:', error);

        if (error.code === 11000) {
            // MongoDB duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                error: {
                    message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
                    code: 'DUPLICATE_KEY'
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update user',
                code: 'USER_UPDATE_ERROR'
            }
        });
    }
};

/**
 * Delete user account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Check authorization - users can only delete their own account or admin can delete any
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to delete this user',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // Delete all tasks associated with this user
        await Task.deleteMany({ user: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        //console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete user',
                code: 'USER_DELETE_ERROR'
            }
        });
    }
};

/**
 * Update user profile (separate endpoint for profile-specific updates)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id; // Get from authenticated user
        const { fullname, username, email, avatar, bio, timezone, jobTitle, company, onboarding } = req.body;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Update fields
        if (fullname !== undefined) user.fullname = fullname;
        if (username !== undefined) user.username = username;
        if (email !== undefined) user.email = email;
        if (avatar !== undefined) user.avatar = avatar;
        if (bio !== undefined) user.bio = bio;
        if (timezone !== undefined) user.timezone = timezone;
        if (jobTitle !== undefined) user.jobTitle = jobTitle;
        if (company !== undefined) user.company = company;
        
        // Update onboarding status
        if (onboarding !== undefined) {
            if (onboarding.completed !== undefined) user.onboarding.completed = onboarding.completed;
            if (onboarding.currentStep !== undefined) user.onboarding.currentStep = onboarding.currentStep;
            if (onboarding.completedSteps !== undefined) user.onboarding.completedSteps = onboarding.completedSteps;
            if (onboarding.completed && !user.onboarding.completedAt) {
                user.onboarding.completedAt = new Date();
            }
        }

        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            data: {
                user: userResponse
            },
            message: 'Profile updated successfully'
        });

    } catch (error) {
        //console.error('Error updating profile:', error);

        if (error.code === 11000) {
            // MongoDB duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                error: {
                    message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
                    code: 'DUPLICATE_KEY'
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update profile',
                code: 'PROFILE_UPDATE_ERROR'
            }
        });
    }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.user._id; // Get from authenticated user
        const { currentPassword, newPassword } = req.body;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Current password is incorrect',
                    code: 'INVALID_CURRENT_PASSWORD'
                }
            });
        }

        // Hash and set new password
        user.password = await hashPassword(newPassword);
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        //console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to change password',
                code: 'PASSWORD_CHANGE_ERROR'
            }
        });
    }
};

/**
 * Upload user avatar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user._id; // Get from authenticated user
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Avatar URL is required',
                    code: 'AVATAR_REQUIRED'
                }
            });
        }

        // Find and update user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        user.avatar = avatar;
        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            data: {
                user: userResponse
            },
            message: 'Avatar updated successfully'
        });

    } catch (error) {
        //console.error('Error uploading avatar:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to upload avatar',
                code: 'AVATAR_UPLOAD_ERROR'
            }
        });
    }
};

/**
 * Delete current user account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteCurrentUser = async (req, res) => {
    try {
        const userId = req.user._id; // Get from authenticated user

        // Delete all tasks associated with this user
        await Task.deleteMany({ user: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        //console.error('Error deleting account:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete account',
                code: 'ACCOUNT_DELETE_ERROR'
            }
        });
    }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        }

        // Generate reset token
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Save reset token and expiry (1 hour)
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send email with reset link
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        
        // Import Resend email service
        const { sendEmail } = await import('../config/resend.js');
        const { passwordResetEmail } = await import('../utils/emailTemplates.js');
        
        const emailTemplate = passwordResetEmail(user.fullname, resetUrl);
        const emailResult = await sendEmail({
            to: user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html
        });

        if (!emailResult.success) {
            //console.warn('Email service error, but reset token generated:', emailResult.error);
        }

        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent',
            ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl }) // Only in dev
        });

    } catch (error) {
        //console.error('Error requesting password reset:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to process password reset request',
                code: 'PASSWORD_RESET_REQUEST_ERROR'
            }
        });
    }
};

/**
 * Reset password with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Password must be at least 6 characters long',
                    code: 'INVALID_PASSWORD'
                }
            });
        }

        // Hash the token to compare with stored hash
        const crypto = await import('crypto');
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid or expired reset token',
                    code: 'INVALID_RESET_TOKEN'
                }
            });
        }

        // Update password
        user.password = await hashPassword(newPassword);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        //console.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to reset password',
                code: 'PASSWORD_RESET_ERROR'
            }
        });
    }
};

/**
 * Discover users for team invitations with pagination and search
 * Excludes current user and optionally team members
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const discoverUsers = async (req, res) => {
    try {
        console.log('  [Backend] Discover users request:', {
            userId: req.user._id,
            query: req.query
        });
        
        const currentUserId = req.user._id;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const search = req.query.q || '';
        const teamId = req.query.teamId;

        // console.log('  [Backend] Parsed params:', {
        //     currentUserId,
        //     page,
        //     limit,
        //     search,
        //     teamId
        // });

        // Build exclusion list
        let excludeIds = [currentUserId];

        // If teamId provided, exclude team members
        if (teamId) {
            try {
                const team = await Team.findById(teamId);
                if (team) {
                    const teamMemberIds = team.members.map(m => m.user.toString());
                    excludeIds = [...new Set([...excludeIds, ...teamMemberIds])];

                }
            } catch (error) {
                console.error('Error fetching team members for exclusion:', error);
                // Continue with search even if team fetch fails
            }
        }

        // Build search query
        let searchQuery = {
            _id: { $nin: excludeIds }
        };

        if (search && search.trim().length >= 2) {
            const searchRegex = new RegExp(search.trim(), 'i');
            searchQuery.$or = [
                { fullname: searchRegex },
                { username: searchRegex },
                { email: searchRegex }
            ];
        }


        // Get total count
        const total = await User.countDocuments(searchQuery);
        const totalPages = Math.ceil(total / limit);



        // Fetch users
        const users = await User.find(searchQuery)
            .select('fullname username email avatar bio isOnline lastActive')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ fullname: 1 })
            .lean();


        console.log('  [Backend] Sample user:', users[0] ? {
            id: users[0]._id,
            fullname: users[0].fullname,
            email: users[0].email
        } : 'No users');

        // If teamId provided, check invitation status for each user
        let usersWithStatus = users;
        if (teamId) {

            usersWithStatus = await Promise.all(users.map(async (user) => {
                const status = await getUserInvitationStatus(user._id.toString(), teamId);
                return {
                    ...user,
                    invitationStatus: status
                };
            }));
        }

        const response = {
            success: true,
            data: {
                users: usersWithStatus,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            },
            message: 'Users discovered successfully'
        };

        console.log('  [Backend] Sending response:', {
            success: response.success,
            userCount: response.data.users.length,
            pagination: response.data.pagination
        });

        res.json(response);

    } catch (error) {

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to discover users',
                code: 'USER_DISCOVERY_ERROR'
            }
        });
    }
};

/**
 * Helper function to check user invitation status for a team
 * @param {String} userId - User ID to check
 * @param {String} teamId - Team ID to check against
 * @returns {String} Status: 'available', 'member', 'pending', or 'invited'
 */
const getUserInvitationStatus = async (userId, teamId) => {
    try {
        // Check if user is already a team member
        const team = await Team.findById(teamId);
        if (team) {
            const isMember = team.members.some(m => m.user.toString() === userId);
            if (isMember) {
                return 'member';
            }
        }

        // Check if there's a pending invitation
        const pendingInvitation = await Invitation.findOne({
            team: teamId,
            user: userId,
            status: 'pending'
        });

        if (pendingInvitation) {
            return 'pending';
        }

        // Check if there's an accepted/rejected invitation (recently invited)
        const recentInvitation = await Invitation.findOne({
            team: teamId,
            user: userId,
            status: { $in: ['accepted', 'rejected'] },
            updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });

        if (recentInvitation) {
            return 'invited';
        }

        return 'available';
    } catch (error) {
        console.error('Error checking invitation status:', error);
        return 'available'; // Default to available on error
    }
};

export {
    getUserById,
    getAllUsers,
    updateUser,
    deleteUser,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteCurrentUser,
    requestPasswordReset,
    resetPassword,
    discoverUsers,
    getUserInvitationStatus,
};