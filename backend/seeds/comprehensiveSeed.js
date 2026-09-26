import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Project from "../models/Project.js";
import Invitation from "../models/Invitation.js";
import Notification from "../models/Notification.js";

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskly');
        console.log('✅ MongoDB connected successfully.');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

// Random Data Generators
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (daysFromNow) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
};

// Generate avatar URLs (using placeholder service)
const getAvatarUrl = (index) => `https://i.pravatar.cc/150?img=${index}`;

// Comprehensive user data
const userData = [
    { fullname: "John Doe", username: "johndoe", email: "john@example.com", password: "password123", avatar: getAvatarUrl(0) },
    { fullname: "Jane Smith", username: "janesmith", email: "jane@example.com", password: "password123", avatar: getAvatarUrl(1) },
    { fullname: "Mike Johnson", username: "mikejohnson", email: "mike@example.com", password: "password123", avatar: getAvatarUrl(2) },
    { fullname: "Sarah Wilson", username: "sarahwilson", email: "sarah@example.com", password: "password123", avatar: getAvatarUrl(3) },
    { fullname: "David Brown", username: "davidbrown", email: "david@example.com", password: "password123", avatar: getAvatarUrl(4) },
    { fullname: "Emily Davis", username: "emilydavis", email: "emily@example.com", password: "password123", avatar: getAvatarUrl(5) },
    { fullname: "Alex Rodriguez", username: "alexrodriguez", email: "alex@example.com", password: "password123", avatar: getAvatarUrl(6) },
    { fullname: "Lisa Anderson", username: "lisaanderson", email: "lisa@example.com", password: "password123", avatar: getAvatarUrl(7) },
    { fullname: "Chris Taylor", username: "christaylor", email: "chris@example.com", password: "password123", avatar: getAvatarUrl(8) },
    { fullname: "Amanda White", username: "amandawhite", email: "amanda@example.com", password: "password123", avatar: getAvatarUrl(9) },
    { fullname: "Ryan Martinez", username: "ryanmartinez", email: "ryan@example.com", password: "password123", avatar: getAvatarUrl(10) },
    { fullname: "Jessica Garcia", username: "jessicagarcia", email: "jessica@example.com", password: "password123", avatar: getAvatarUrl(11) },
    { fullname: "Kevin Lee", username: "kevinlee", email: "kevin@example.com", password: "password123", avatar: getAvatarUrl(12) },
    { fullname: "Michelle Thompson", username: "michellethompson", email: "michelle@example.com", password: "password123", avatar: getAvatarUrl(13) },
    { fullname: "Daniel Clark", username: "danielclark", email: "daniel@example.com", password: "password123", avatar: getAvatarUrl(14) }
];

// Task templates
const taskTemplates = [
    { title: "Complete project proposal", description: "Write and submit the quarterly project proposal", priority: "high", tags: ["work", "urgent"] },
    { title: "Review team performance", description: "Conduct quarterly performance reviews", priority: "medium", tags: ["management", "review"] },
    { title: "Update website content", description: "Refresh the company website with new information", priority: "medium", tags: ["web", "content"] },
    { title: "Prepare presentation slides", description: "Create presentation slides for client meeting", priority: "high", tags: ["presentation", "client"] },
    { title: "Organize team building event", description: "Plan team building event for department", priority: "low", tags: ["team", "event"] },
    { title: "Code review for new feature", description: "Review code implementation for new feature", priority: "high", tags: ["code", "review"] },
    { title: "Database optimization", description: "Optimize database queries for performance", priority: "medium", tags: ["database", "optimization"] },
    { title: "Write technical documentation", description: "Create documentation for API endpoints", priority: "medium", tags: ["documentation", "api"] },
    { title: "Client feedback analysis", description: "Analyze client feedback and recommendations", priority: "low", tags: ["analysis", "feedback"] },
    { title: "Security audit", description: "Conduct comprehensive security audit", priority: "high", tags: ["security", "audit"] },
    { title: "Budget planning meeting", description: "Attend budget planning meeting", priority: "medium", tags: ["budget", "meeting"] },
    { title: "Employee training session", description: "Conduct training on new policies", priority: "low", tags: ["training", "policies"] },
    { title: "Market research report", description: "Compile market research data", priority: "medium", tags: ["research", "market"] },
    { title: "System backup verification", description: "Verify system backups are working", priority: "high", tags: ["backup", "system"] },
    { title: "Social media campaign", description: "Launch social media campaign", priority: "low", tags: ["social", "campaign"] }
];

// Team templates with detailed info
const teamTemplates = [
    {
        name: "Product Development Team",
        description: "Building innovative products and features for our customers",
        tags: ["development", "product", "engineering"],
        isPrivate: false
    },
    {
        name: "Marketing & Growth",
        description: "Driving customer acquisition and brand awareness",
        tags: ["marketing", "growth", "branding"],
        isPrivate: false
    },
    {
        name: "Design Studio",
        description: "Creating beautiful and intuitive user experiences",
        tags: ["design", "ux", "ui"],
        isPrivate: false
    },
    {
        name: "Data Analytics Team",
        description: "Turning data into actionable insights",
        tags: ["analytics", "data", "insights"],
        isPrivate: true
    },
    {
        name: "Customer Success",
        description: "Ensuring customer satisfaction and retention",
        tags: ["support", "customer", "success"],
        isPrivate: false
    }
];

// Project templates
const projectTemplates = [
    {
        name: "Mobile App Redesign",
        description: "Complete redesign of the mobile application with modern UI/UX principles",
        priority: "high",
        status: "active",
        tags: ["mobile", "design", "ui/ux"]
    },
    {
        name: "Q4 Marketing Campaign",
        description: "Launch comprehensive marketing campaign for Q4 product releases",
        priority: "high",
        status: "planning",
        tags: ["marketing", "campaign", "q4"]
    },
    {
        name: "API v2 Development",
        description: "Build next generation API with improved performance and features",
        priority: "medium",
        status: "active",
        tags: ["api", "backend", "development"]
    },
    {
        name: "Customer Onboarding Flow",
        description: "Improve customer onboarding experience and reduce churn",
        priority: "high",
        status: "active",
        tags: ["onboarding", "ux", "customer"]
    },
    {
        name: "Analytics Dashboard",
        description: "Build comprehensive analytics dashboard for business insights",
        priority: "medium",
        status: "planning",
        tags: ["analytics", "dashboard", "data"]
    },
    {
        name: "Security Audit 2024",
        description: "Comprehensive security audit and vulnerability assessment",
        priority: "high",
        status: "on-hold",
        tags: ["security", "audit", "compliance"]
    },
    {
        name: "Documentation Portal",
        description: "Create centralized documentation portal for all products",
        priority: "low",
        status: "planning",
        tags: ["documentation", "portal", "knowledge"]
    },
    {
        name: "Performance Optimization",
        description: "Optimize application performance and reduce load times",
        priority: "medium",
        status: "active",
        tags: ["performance", "optimization", "speed"]
    }
];

// Generate tasks with realistic stats
const generateTasksForUsers = (users) => {
    const tasks = [];
    
    users.forEach((user) => {
        const numTasks = getRandomNumber(8, 15);
        
        for (let i = 0; i < numTasks; i++) {
            const template = getRandomItem(taskTemplates);
            const status = getRandomItem(["completed", "in-progress", "failed"]);
            
            let dueDate;
            if (status === 'completed') {
                dueDate = getRandomDate(getRandomNumber(-20, -1));
            } else if (status === 'failed') {
                dueDate = getRandomDate(getRandomNumber(-15, -1));
            } else {
                dueDate = getRandomDate(getRandomNumber(1, 30));
            }
            
            tasks.push({
                title: `${template.title} - ${user.fullname.split(' ')[0]}`,
                description: template.description,
                due: dueDate,
                priority: template.priority,
                tags: template.tags,
                status: status,
                user: user._id,
                createdAt: getRandomDate(getRandomNumber(-60, -1)),
                updatedAt: getRandomDate(getRandomNumber(-10, 0))
            });
        }
    });
    
    return tasks;
};

// Calculate team statistics
const calculateTeamStats = async (teamId, teamMembers) => {
    // Get all tasks for team members
    const memberIds = teamMembers.map(m => m.user);
    const allTasks = await Task.find({ user: { $in: memberIds } });
    
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const failed = allTasks.filter(t => t.status === 'failed').length;
    const inProgress = allTasks.filter(t => t.status === 'in-progress').length;
    const total = allTasks.length;
    
    // Project status distribution
    const projects = await Project.find({ team: teamId });
    const projectStatusDist = {
        active: projects.filter(p => p.status === 'active').length,
        planning: projects.filter(p => p.status === 'planning').length,
        completed: projects.filter(p => p.status === 'completed').length,
        onHold: projects.filter(p => p.status === 'on-hold').length
    };
    
    // Task progress
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0;
    
    // Productivity trend (this week, this month, this quarter)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const thisWeek = allTasks.filter(t => new Date(t.updatedAt) > weekAgo && t.status === 'completed').length;
    const thisMonth = allTasks.filter(t => new Date(t.updatedAt) > monthAgo && t.status === 'completed').length;
    const thisQuarter = allTasks.filter(t => new Date(t.updatedAt) > quarterAgo && t.status === 'completed').length;
    
    // Member activity
    const memberActivity = {};
    for (const member of teamMembers) {
        const memberTasks = allTasks.filter(t => t.user.toString() === member.user.toString());
        const memberCompleted = memberTasks.filter(t => t.status === 'completed').length;
        memberActivity[member.user.toString()] = {
            tasksCompleted: memberCompleted,
            tasksInProgress: memberTasks.filter(t => t.status === 'in-progress').length,
            tasksFailed: memberTasks.filter(t => t.status === 'failed').length,
            completionRate: memberTasks.length > 0 ? Math.round((memberCompleted / memberTasks.length) * 100) : 0,
            lastActive: memberTasks.length > 0 ? new Date(Math.max(...memberTasks.map(t => new Date(t.updatedAt)))) : null
        };
    }
    
    return {
        overview: {
            totalTasks: total,
            completedTasks: completed,
            failedTasks: failed,
            inProgressTasks: inProgress,
            completionRate: completionRate,
            failureRate: failureRate
        },
        projectStatusDistribution: projectStatusDist,
        taskProgress: {
            completed: completed,
            inProgress: inProgress,
            failed: failed,
            total: total
        },
        productivityTrend: {
            thisWeek: thisWeek,
            thisMonth: thisMonth,
            thisQuarter: thisQuarter,
            weeklyAverage: Math.round(thisMonth / 4),
            monthlyAverage: Math.round(thisQuarter / 3)
        },
        memberActivity: memberActivity,
        teamHealth: {
            score: Math.max(0, 100 - failureRate),
            status: failureRate < 10 ? 'excellent' : failureRate < 20 ? 'good' : failureRate < 30 ? 'fair' : 'needs-improvement',
            activeMembers: teamMembers.length,
            avgTasksPerMember: Math.round(total / teamMembers.length)
        }
    };
};

// Calculate project statistics
const calculateProjectStats = async (projectId, projectMembers) => {
    const project = await Project.findById(projectId).populate('tasks');
    const tasks = project.tasks || [];
    
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const total = tasks.length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const progress = completionRate;
    
    // Task distribution by priority
    const tasksByPriority = {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
    };
    
    // Task distribution by status
    const tasksByStatus = {
        completed: completed,
        inProgress: inProgress,
        failed: failed
    };
    
    // Member contribution
    const memberContribution = {};
    for (const member of projectMembers) {
        const memberTasks = tasks.filter(t => t.user && t.user.toString() === member.user.toString());
        memberContribution[member.user.toString()] = {
            tasksAssigned: memberTasks.length,
            tasksCompleted: memberTasks.filter(t => t.status === 'completed').length,
            tasksInProgress: memberTasks.filter(t => t.status === 'in-progress').length,
            role: member.role
        };
    }
    
    // Timeline
    const daysElapsed = Math.floor((new Date() - project.startDate) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((project.endDate - project.startDate) / (1000 * 60 * 60 * 24));
    const timelineProgress = Math.round((daysElapsed / totalDays) * 100);
    
    return {
        overview: {
            totalTasks: total,
            completedTasks: completed,
            inProgressTasks: inProgress,
            failedTasks: failed,
            completionRate: completionRate,
            progress: progress
        },
        tasksByPriority: tasksByPriority,
        tasksByStatus: tasksByStatus,
        memberContribution: memberContribution,
        timeline: {
            startDate: project.startDate,
            endDate: project.endDate,
            daysElapsed: daysElapsed,
            totalDays: totalDays,
            timelineProgress: timelineProgress,
            daysRemaining: Math.max(0, totalDays - daysElapsed)
        },
        budget: {
            allocated: project.budget?.allocated || 0,
            spent: project.budget?.spent || 0,
            remaining: (project.budget?.allocated || 0) - (project.budget?.spent || 0),
            percentageUsed: project.budget?.allocated ? Math.round(((project.budget?.spent || 0) / project.budget.allocated) * 100) : 0
        },
        health: {
            score: Math.max(0, 100 - (failed * 5)),
            status: completionRate >= 75 ? 'on-track' : completionRate >= 50 ? 'at-risk' : 'behind-schedule',
            riskLevel: failed > 5 ? 'high' : failed > 2 ? 'medium' : 'low'
        }
    };
};

// Create teams with members
const createTeams = async (users) => {
    const teams = [];
    
    for (let i = 0; i < teamTemplates.length; i++) {
        const template = teamTemplates[i];
        const owner = users[i % users.length];
        const inviteCode = crypto.randomBytes(8).toString('hex');
        
        const numMembers = getRandomNumber(3, 7);
        const teamMembers = [];
        
        teamMembers.push({
            user: owner._id,
            role: 'owner',
            joinedAt: getRandomDate(getRandomNumber(-90, -30))
        });
        
        const availableUsers = users.filter(u => u._id.toString() !== owner._id.toString());
        const shuffled = availableUsers.sort(() => 0.5 - Math.random());
        const selectedMembers = shuffled.slice(0, numMembers - 1);
        
        selectedMembers.forEach((user, index) => {
            const role = index === 0 ? 'admin' : 'member';
            teamMembers.push({
                user: user._id,
                role: role,
                joinedAt: getRandomDate(getRandomNumber(-60, -5))
            });
        });
        
        const team = new Team({
            name: template.name,
            description: template.description,
            owner: owner._id,
            members: teamMembers,
            inviteCode: inviteCode,
            isPrivate: template.isPrivate,
            tags: template.tags,
            settings: {
                allowMemberInvites: true,
                requireApprovalForJoin: template.isPrivate,
                defaultMemberRole: 'member',
                maxMembers: 50
            },
            createdAt: getRandomDate(getRandomNumber(-120, -30)),
            updatedAt: getRandomDate(getRandomNumber(-10, 0))
        });
        
        teams.push(team);
    }
    
    return await Team.insertMany(teams);
};

// Create projects for teams
const createProjects = async (teams, users) => {
    const projects = [];
    
    for (const team of teams) {
        const numProjects = getRandomNumber(1, 3);
        const availableTemplates = [...projectTemplates].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < numProjects && i < availableTemplates.length; i++) {
            const template = availableTemplates[i];
            const owner = team.members[0].user;
            
            const numMembers = Math.min(getRandomNumber(2, 5), team.members.length);
            const projectMembers = [];
            
            projectMembers.push({
                user: owner,
                role: 'manager',
                joinedAt: getRandomDate(getRandomNumber(-60, -20))
            });
            
            const otherMembers = team.members
                .filter(m => m.user.toString() !== owner.toString())
                .sort(() => 0.5 - Math.random())
                .slice(0, numMembers - 1);
            
            otherMembers.forEach((member, index) => {
                const role = index === 0 ? 'manager' : getRandomItem(['contributor', 'contributor', 'viewer']);
                projectMembers.push({
                    user: member.user,
                    role: role,
                    joinedAt: getRandomDate(getRandomNumber(-50, -10))
                });
            });
            
            const startDate = getRandomDate(getRandomNumber(-60, -10));
            const endDate = getRandomDate(getRandomNumber(10, 90));
            
            const milestones = [];
            const numMilestones = getRandomNumber(2, 4);
            for (let m = 0; m < numMilestones; m++) {
                const milestoneDate = new Date(startDate.getTime() + ((endDate.getTime() - startDate.getTime()) / numMilestones) * (m + 1));
                milestones.push({
                    name: `Milestone ${m + 1}: ${getRandomItem(['Planning', 'Development', 'Testing', 'Launch', 'Review'])}`,
                    description: `Complete phase ${m + 1} of the project`,
                    dueDate: milestoneDate,
                    status: m === 0 ? 'completed' : m === 1 ? 'in-progress' : 'pending',
                    completedAt: m === 0 ? new Date(milestoneDate.getTime() - 86400000) : null,
                    createdAt: getRandomDate(getRandomNumber(-60, -20))
                });
            }
            
            const project = new Project({
                name: `${template.name} - ${team.name.split(' ')[0]}`,
                description: template.description,
                team: team._id,
                owner: owner,
                members: projectMembers,
                status: template.status,
                priority: template.priority,
                startDate: startDate,
                endDate: endDate,
                budget: {
                    allocated: getRandomNumber(10000, 100000),
                    spent: getRandomNumber(5000, 50000),
                    currency: 'USD'
                },
                tags: template.tags,
                milestones: milestones,
                settings: {
                    isPublic: !team.isPrivate,
                    allowTaskCreation: true,
                    requireTaskApproval: false,
                    autoAssignTasks: false
                },
                createdAt: getRandomDate(getRandomNumber(-60, -20)),
                updatedAt: getRandomDate(getRandomNumber(-10, 0))
            });
            
            projects.push(project);
        }
    }
    
    const createdProjects = await Project.insertMany(projects);
    
    for (const project of createdProjects) {
        await Team.findByIdAndUpdate(
            project.team,
            { $push: { projects: project._id } }
        );
    }
    
    return createdProjects;
};

// Assign tasks to projects
const assignTasksToProjects = async (tasks, projects, users) => {
    const numTasksToAssign = Math.floor(tasks.length * 0.7);
    const shuffledTasks = [...tasks].sort(() => 0.5 - Math.random()).slice(0, numTasksToAssign);
    
    for (const task of shuffledTasks) {
        const userProjects = projects.filter(p => 
            p.members.some(m => m.user.toString() === task.user.toString())
        );
        
        if (userProjects.length > 0) {
            const project = getRandomItem(userProjects);
            const projectMember = getRandomItem(project.members);
            
            task.project = project._id;
            task.assignee = projectMember.user;
            await task.save();
            
            await Project.findByIdAndUpdate(
                project._id,
                { $push: { tasks: task._id } }
            );
        }
    }
};

// Create sample invitations
const createInvitations = async (teams, users) => {
    const invitations = [];
    
    for (const team of teams) {
        // Create 2-3 pending invitations per team
        const invitationCount = getRandomNumber(2, 3);
        const teamMembers = team.members.map(m => m.user.toString());
        
        for (let i = 0; i < invitationCount; i++) {
            let invitee;
            // Make sure invitee is not already a team member
            do {
                invitee = getRandomItem(users);
            } while (teamMembers.includes(invitee._id.toString()));
            
            const inviter = getRandomItem(team.members);
            
            invitations.push({
                team: team._id,
                inviter: inviter.user,
                invitee: invitee._id,
                role: getRandomItem(['member', 'admin']),
                message: `Join our team ${team.name}! We're working on exciting projects.`,
                status: 'pending',
                createdAt: getRandomDate(getRandomNumber(-30, -1)),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
        }
    }
    
    const createdInvitations = await Invitation.insertMany(invitations);
    return createdInvitations;
};

// Create sample notifications
const createNotifications = async (users, invitations) => {
    const notifications = [];
    
    // Create invitation received notifications
    for (const invitation of invitations) {
        notifications.push({
            recipient: invitation.invitee,
            type: 'invitation_received',
            title: `Invited to team`,
            message: `You've been invited to join a team`,
            data: {
                invitationId: invitation._id,
                teamId: invitation.team,
                inviterId: invitation.inviter
            },
            read: false,
            createdAt: invitation.createdAt
        });
    }
    
    // Create some task assignment notifications
    const tasks = await Task.find().limit(10);
    for (const task of tasks) {
        if (task.assignee) {
            notifications.push({
                recipient: task.assignee,
                type: 'task_assigned',
                title: 'Task assigned to you',
                message: `You've been assigned: ${task.title}`,
                data: {
                    taskId: task._id,
                    projectId: task.project
                },
                read: Math.random() > 0.5,
                createdAt: getRandomDate(getRandomNumber(-30, 0))
            });
        }
    }
    
    const createdNotifications = await Notification.insertMany(notifications);
    return createdNotifications;
};

// Main seed function
const seedDB = async () => {
    try {
        console.log("\n🌱 Starting comprehensive database seeding...\n");
        
        // Clear existing data
        await Task.deleteMany({});
        await Project.deleteMany({});
        await Team.deleteMany({});
        await User.deleteMany({});
        await Invitation.deleteMany({});
        await Notification.deleteMany({});
        console.log("✅ Existing collections cleared.");

        // Create users
        const users = [];
        for (const user of userData) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            users.push({
                ...user,
                password: hashedPassword,
                created_at: getRandomDate(getRandomNumber(-365, -30))
            });
        }
        
        const createdUsers = await User.insertMany(users);
        console.log(`✅ ${createdUsers.length} users created.`);

        // Generate and create tasks
        const tasks = generateTasksForUsers(createdUsers);
        const createdTasks = await Task.insertMany(tasks);
        console.log(`✅ ${createdTasks.length} tasks created.`);

        // Create teams
        const teams = await createTeams(createdUsers);
        console.log(`✅ ${teams.length} teams created.`);

        // Create projects
        const projects = await createProjects(teams, createdUsers);
        console.log(`✅ ${projects.length} projects created.`);

        // Assign tasks to projects
        await assignTasksToProjects(createdTasks, projects, createdUsers);
        console.log(`✅ Tasks assigned to projects.`);

        // Create invitations
        const invitations = await createInvitations(teams, createdUsers);
        console.log(`✅ ${invitations.length} invitations created.`);

        // Create notifications
        const notifications = await createNotifications(createdUsers, invitations);
        console.log(`✅ ${notifications.length} notifications created.`);

        // Calculate and update team statistics
        console.log("\n📊 Calculating team statistics...");
        for (const team of teams) {
            const stats = await calculateTeamStats(team._id, team.members);
            await Team.findByIdAndUpdate(team._id, { stats });
            console.log(`   ✅ ${team.name} - Stats calculated`);
        }

        // Calculate and update project statistics
        console.log("\n📊 Calculating project statistics...");
        for (const project of projects) {
            const stats = await calculateProjectStats(project._id, project.members);
            await Project.findByIdAndUpdate(project._id, { stats });
            console.log(`   ✅ ${project.name} - Stats calculated`);
        }

        console.log("\n" + "=".repeat(60));
        console.log("🎉 SEEDING COMPLETE");
        console.log("=".repeat(60));
        console.log(`\n📈 Summary:`);
        console.log(`   • ${createdUsers.length} users created`);
        console.log(`   • ${createdTasks.length} tasks created`);
        console.log(`   • ${teams.length} teams created with detailed stats`);
        console.log(`   • ${projects.length} projects created with detailed stats`);
        console.log(`   • ${invitations.length} invitations created`);
        console.log(`   • ${notifications.length} notifications created`);
        
        console.log(`\n🔐 Sample Login Credentials:`);
        console.log(`   Email: john@example.com | Password: password123`);
        console.log(`   Email: jane@example.com | Password: password123`);
        console.log(`   Email: mike@example.com | Password: password123`);
        
        console.log(`\n🎫 Team Invite Codes:`);
        teams.forEach(team => {
            console.log(`   ${team.name}: ${team.inviteCode}`);
        });
        
        console.log("\n✨ Database is ready with comprehensive stats!\n");
        
    } catch (error) {
        console.error("❌ Error seeding database:", error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the seed script
connectDB().then(() => seedDB());
