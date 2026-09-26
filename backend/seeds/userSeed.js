import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Project from "../models/Project.js";
import { getAvatarUrl, initializeAvatars } from "../utils/cloudinarySeeder.js";

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/taskly');
        console.log('MongoDB connected successfully.');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
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

// Comprehensive user data
const userData = [
    {
        fullname: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        password: "password123",
        avatar: getAvatarUrl(0)
    },
    {
        fullname: "Jane Smith",
        username: "janesmith",
        email: "jane@example.com",
        password: "password123",
        avatar: getAvatarUrl(1)
    },
    {
        fullname: "Mike Johnson",
        username: "mikejohnson",
        email: "mike@example.com",
        password: "password123",
        avatar: getAvatarUrl(2)
    },
    {
        fullname: "Sarah Wilson",
        username: "sarahwilson",
        email: "sarah@example.com",
        password: "password123",
        avatar: getAvatarUrl(3)
    },
    {
        fullname: "David Brown",
        username: "davidbrown",
        email: "david@example.com",
        password: "password123",
        avatar: getAvatarUrl(4)
    },
    {
        fullname: "Emily Davis",
        username: "emilydavis",
        email: "emily@example.com",
        password: "password123",
        avatar: getAvatarUrl(5)
    },
    {
        fullname: "Alex Rodriguez",
        username: "alexrodriguez",
        email: "alex@example.com",
        password: "password123",
        avatar: getAvatarUrl(6)
    },
    {
        fullname: "Lisa Anderson",
        username: "lisaanderson",
        email: "lisa@example.com",
        password: "password123",
        avatar: getAvatarUrl(7)
    },
    {
        fullname: "Chris Taylor",
        username: "christaylor",
        email: "chris@example.com",
        password: "password123",
        avatar: getAvatarUrl(8)
    },
    {
        fullname: "Amanda White",
        username: "amandawhite",
        email: "amanda@example.com",
        password: "password123",
        avatar: getAvatarUrl(9)
    },
    {
        fullname: "Ryan Martinez",
        username: "ryanmartinez",
        email: "ryan@example.com",
        password: "password123",
        avatar: getAvatarUrl(10)
    },
    {
        fullname: "Jessica Garcia",
        username: "jessicagarcia",
        email: "jessica@example.com",
        password: "password123",
        avatar: getAvatarUrl(11)
    },
    {
        fullname: "Kevin Lee",
        username: "kevinlee",
        email: "kevin@example.com",
        password: "password123",
        avatar: getAvatarUrl(12)
    },
    {
        fullname: "Michelle Thompson",
        username: "michellethompson",
        email: "michelle@example.com",
        password: "password123",
        avatar: getAvatarUrl(13)
    },
    {
        fullname: "Daniel Clark",
        username: "danielclark",
        email: "daniel@example.com",
        password: "password123",
        avatar: getAvatarUrl(14)
    }
];

// Comprehensive task templates
const taskTemplates = [
    {
        title: "Complete project proposal",
        description: "Write and submit the quarterly project proposal with budget analysis and timeline.",
        priority: "high",
        tags: ["work", "urgent", "proposal"]
    },
    {
        title: "Review team performance",
        description: "Conduct quarterly performance reviews for all team members and provide feedback.",
        priority: "medium",
        tags: ["management", "review", "team"]
    },
    {
        title: "Update website content",
        description: "Refresh the company website with new product information and testimonials.",
        priority: "medium",
        tags: ["web", "content", "marketing"]
    },
    {
        title: "Prepare presentation slides",
        description: "Create presentation slides for the upcoming client meeting next week.",
        priority: "high",
        tags: ["presentation", "client", "meeting"]
    },
    {
        title: "Organize team building event",
        description: "Plan and organize a team building event for the entire department.",
        priority: "low",
        tags: ["team", "event", "planning"]
    },
    {
        title: "Code review for new feature",
        description: "Review the code implementation for the new user authentication feature.",
        priority: "high",
        tags: ["code", "review", "development"]
    },
    {
        title: "Database optimization",
        description: "Optimize database queries to improve application performance.",
        priority: "medium",
        tags: ["database", "optimization", "performance"]
    },
    {
        title: "Write technical documentation",
        description: "Create comprehensive documentation for the new API endpoints.",
        priority: "medium",
        tags: ["documentation", "api", "technical"]
    },
    {
        title: "Client feedback analysis",
        description: "Analyze recent client feedback and prepare improvement recommendations.",
        priority: "low",
        tags: ["analysis", "feedback", "client"]
    },
    {
        title: "Security audit",
        description: "Conduct a comprehensive security audit of the application infrastructure.",
        priority: "high",
        tags: ["security", "audit", "infrastructure"]
    },
    {
        title: "Budget planning meeting",
        description: "Attend the quarterly budget planning meeting and present department needs.",
        priority: "medium",
        tags: ["budget", "meeting", "planning"]
    },
    {
        title: "Employee training session",
        description: "Conduct training session on new company policies and procedures.",
        priority: "low",
        tags: ["training", "policies", "education"]
    },
    {
        title: "Market research report",
        description: "Compile market research data and create comprehensive analysis report.",
        priority: "medium",
        tags: ["research", "market", "analysis"]
    },
    {
        title: "System backup verification",
        description: "Verify that all system backups are working correctly and data is recoverable.",
        priority: "high",
        tags: ["backup", "system", "verification"]
    },
    {
        title: "Social media campaign",
        description: "Launch new social media campaign for product promotion.",
        priority: "low",
        tags: ["social", "campaign", "marketing"]
    }
];

// Generate tasks for users
const generateTasksForUsers = (users) => {
    const tasks = [];
    
    users.forEach((user, userIndex) => {
        const numTasks = getRandomNumber(8, 15); // Each user gets 8-15 tasks
        
        for (let i = 0; i < numTasks; i++) {
            const template = getRandomItem(taskTemplates);
            const status = getRandomItem(["completed", "in-progress", "failed"]);
            
            // Create realistic due dates based on status
            let dueDate;
            if (status === 'completed') {
                // Completed tasks can have past due dates (they were finished)
                dueDate = getRandomDate(getRandomNumber(-20, -1));
            } else if (status === 'failed') {
                // Failed tasks should have past due dates (they missed the deadline)
                dueDate = getRandomDate(getRandomNumber(-15, -1));
            } else {
                // In-progress tasks should have future due dates
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
                createdAt: getRandomDate(getRandomNumber(-60, -1)), // Created 1-60 days ago
                updatedAt: getRandomDate(getRandomNumber(-10, 0)) // Updated within last 10 days
            });
        }
    });
    
    return tasks;
};

// Calculate user statistics
const calculateUserStats = async (userId) => {
    const userTasks = await Task.find({ user: userId });
    
    const completed = userTasks.filter(task => task.status === 'completed').length;
    const failed = userTasks.filter(task => task.status === 'failed').length;
    const ongoing = userTasks.filter(task => task.status === 'in-progress').length;
    const total = userTasks.length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const streak = getRandomNumber(0, 15); // Random streak for demo
    const avgTime = `${getRandomNumber(1, 8)} hrs`; // Random average time
    
    return {
        completed,
        failed,
        ongoing,
        completionRate,
        streak,
        avgTime
    };
};

// Team data templates
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

// Project data templates
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

// Create teams with members
const createTeams = async (users) => {
    const teams = [];
    
    for (let i = 0; i < teamTemplates.length; i++) {
        const template = teamTemplates[i];
        const owner = users[i % users.length];
        
        // Generate unique invite code
        const inviteCode = crypto.randomBytes(8).toString('hex');
        
        // Select random members (3-7 members per team)
        const numMembers = getRandomNumber(3, 7);
        const teamMembers = [];
        
        // Add owner as first member
        teamMembers.push({
            user: owner._id,
            role: 'owner',
            joinedAt: getRandomDate(getRandomNumber(-90, -30))
        });
        
        // Add random members
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
        // Each team gets 1-3 projects
        const numProjects = getRandomNumber(1, 3);
        const availableTemplates = [...projectTemplates].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < numProjects && i < availableTemplates.length; i++) {
            const template = availableTemplates[i];
            const owner = team.members[0].user; // Team owner is project owner
            
            // Select project members from team members (2-5 members)
            const numMembers = Math.min(getRandomNumber(2, 5), team.members.length);
            const projectMembers = [];
            
            // Add owner as manager
            projectMembers.push({
                user: owner,
                role: 'manager',
                joinedAt: getRandomDate(getRandomNumber(-60, -20))
            });
            
            // Add other team members
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
            
            // Set project dates
            const startDate = getRandomDate(getRandomNumber(-60, -10));
            const endDate = getRandomDate(getRandomNumber(10, 90));
            
            // Create milestones
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
    
    // Update teams with project references
    for (const project of createdProjects) {
        await Team.findByIdAndUpdate(
            project.team,
            { $push: { projects: project._id } }
        );
    }
    
    return createdProjects;
};

// Assign some tasks to projects
const assignTasksToProjects = async (tasks, projects, users) => {
    // Assign 70% of tasks to projects
    const numTasksToAssign = Math.floor(tasks.length * 0.7);
    const shuffledTasks = [...tasks].sort(() => 0.5 - Math.random()).slice(0, numTasksToAssign);
    
    for (const task of shuffledTasks) {
        // Find projects where the task owner is a member
        const userProjects = projects.filter(p => 
            p.members.some(m => m.user.toString() === task.user.toString())
        );
        
        if (userProjects.length > 0) {
            const project = getRandomItem(userProjects);
            
            // Randomly assign to another project member
            const projectMember = getRandomItem(project.members);
            
            task.project = project._id;
            task.assignee = projectMember.user;
            await task.save();
            
            // Add task to project
            await Project.findByIdAndUpdate(
                project._id,
                { $push: { tasks: task._id } }
            );
        }
    }
};

// Seed database
const seedDB = async () => {
    try {
        console.log("Starting database seeding...");
        
        // Initialize avatars (upload local images to Cloudinary)
        await initializeAvatars();
        
        // Clear existing data
        await Task.deleteMany({});
        await Project.deleteMany({});
        await Team.deleteMany({});
        await User.deleteMany({});
        console.log("Existing collections cleared.");

        // Create users with hashed passwords
        const users = [];
        for (const user of userData) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            users.push({
                ...user,
                password: hashedPassword,
                created_at: getRandomDate(getRandomNumber(-365, -30)) // Created 30-365 days ago
            });
        }
        
        const createdUsers = await User.insertMany(users);
        console.log(`${createdUsers.length} users created.`);

        // Generate and create tasks
        const tasks = generateTasksForUsers(createdUsers);
        const createdTasks = await Task.insertMany(tasks);
        console.log(`${createdTasks.length} tasks created.`);

        // Update users with statistics
        for (const user of createdUsers) {
            const stats = await calculateUserStats(user._id);
            await User.findByIdAndUpdate(user._id, { stats });
        }
        console.log("User statistics calculated and updated.");

        // Create teams
        const teams = await createTeams(createdUsers);
        console.log(`${teams.length} teams created.`);

        // Create projects
        const projects = await createProjects(teams, createdUsers);
        console.log(`${projects.length} projects created.`);

        // Assign tasks to projects
        await assignTasksToProjects(createdTasks, projects, createdUsers);
        console.log("Tasks assigned to projects.");

        console.log("\n=== SEEDING COMPLETE ===");
        console.log(`Created ${createdUsers.length} users with ${createdTasks.length} tasks`);
        console.log(`Created ${teams.length} teams with ${projects.length} projects`);
        console.log("\nSample login credentials:");
        console.log("Email: john@example.com | Password: password123");
        console.log("Email: jane@example.com | Password: password123");
        console.log("Email: mike@example.com | Password: password123");
        console.log("\nTeam invite codes:");
        teams.forEach(team => {
            console.log(`${team.name}: ${team.inviteCode}`);
        });
        
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the seed script
connectDB().then(() => seedDB());