import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Task from "./models/Task.js";
import User from "./models/User.js";
import Team from "./models/Team.js";
import Project from "./models/Project.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskly';
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully.');

        // Clear existing data
        await Task.deleteMany({});
        await User.deleteMany({});
        await Team.deleteMany({});
        await Project.deleteMany({});
        console.log('🧹 Cleared existing data.');

        // Create sample users
        const users = [
            {
                fullname: "John Doe",
                username: "johndoe",
                email: "john@example.com",
                password: await bcrypt.hash("password123", 10),
                avatar: "https://res.cloudinary.com/dbdbod1wt/image/upload/v1751666550/placeholder-user_rbr3rs.png"
            },
            {
                fullname: "Jane Smith",
                username: "janesmith",
                email: "jane@example.com",
                password: await bcrypt.hash("password123", 10),
                avatar: "https://res.cloudinary.com/dbdbod1wt/image/upload/v1751666550/placeholder-user_rbr3rs.png"
            },
            {
                fullname: "Mike Johnson",
                username: "mikejohnson",
                email: "mike@example.com",
                password: await bcrypt.hash("password123", 10),
                avatar: "https://res.cloudinary.com/dbdbod1wt/image/upload/v1751666550/placeholder-user_rbr3rs.png"
            },
            {
                fullname: "Sarah Wilson",
                username: "sarahwilson",
                email: "sarah@example.com",
                password: await bcrypt.hash("password123", 10),
                avatar: "https://res.cloudinary.com/dbdbod1wt/image/upload/v1751666550/placeholder-user_rbr3rs.png"
            },
            {
                fullname: "Alex Chen",
                username: "alexchen",
                email: "alex@example.com",
                password: await bcrypt.hash("password123", 10),
                avatar: "https://res.cloudinary.com/dbdbod1wt/image/upload/v1751666550/placeholder-user_rbr3rs.png"
            }
        ];

        const createdUsers = await User.insertMany(users);
        console.log(`✅ Created ${createdUsers.length} users.`);

        // Create sample tasks for each user
        const tasks = [];
        const taskTemplates = [
            {
                title: "Complete project documentation",
                description: "Write comprehensive documentation for the new project including API docs and user guides.",
                priority: "high",
                tags: ["documentation", "project"],
                labels: ["work", "urgent"],
                status: "in-progress"
            },
            {
                title: "Review pull requests",
                description: "Review and approve pending pull requests from team members.",
                priority: "medium",
                tags: ["code-review", "development"],
                labels: ["work", "team"],
                status: "in-progress"
            },
            {
                title: "Update dependencies",
                description: "Update all project dependencies to their latest stable versions.",
                priority: "low",
                tags: ["maintenance", "dependencies"],
                labels: ["work", "maintenance"],
                status: "completed"
            },
            {
                title: "Design new user interface",
                description: "Create mockups and prototypes for the new user interface design.",
                priority: "high",
                tags: ["design", "ui-ux"],
                labels: ["design", "creative"],
                status: "in-progress"
            },
            {
                title: "Set up CI/CD pipeline",
                description: "Configure continuous integration and deployment pipeline for the project.",
                priority: "medium",
                tags: ["devops", "automation"],
                labels: ["work", "infrastructure"],
                status: "in-progress"
            },
            {
                title: "Write unit tests",
                description: "Add comprehensive unit tests for all new features and components.",
                priority: "high",
                tags: ["testing", "quality"],
                labels: ["work", "testing"],
                status: "in-progress"
            },
            {
                title: "Optimize database queries",
                description: "Analyze and optimize slow database queries to improve performance.",
                priority: "medium",
                tags: ["database", "performance"],
                labels: ["work", "optimization"],
                status: "in-progress"
            },
            {
                title: "Plan team meeting",
                description: "Organize and schedule the monthly team meeting with agenda items.",
                priority: "low",
                tags: ["meeting", "planning"],
                labels: ["work", "management"],
                status: "completed"
            },
            {
                title: "Research new technologies",
                description: "Investigate new technologies and frameworks for upcoming projects.",
                priority: "low",
                tags: ["research", "technology"],
                labels: ["learning", "innovation"],
                status: "in-progress"
            },
            {
                title: "Fix critical bug",
                description: "Investigate and fix the critical bug reported in production.",
                priority: "high",
                tags: ["bug-fix", "critical"],
                labels: ["work", "urgent"],
                status: "in-progress"
            }
        ];

        // Create tasks for each user
        createdUsers.forEach((user, userIndex) => {
            // Each user gets 3-5 tasks
            const numTasks = Math.floor(Math.random() * 3) + 3;

            for (let i = 0; i < numTasks; i++) {
                const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
                const daysOffset = Math.floor(Math.random() * 30) - 15; // -15 to +15 days from now
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + daysOffset);

                tasks.push({
                    ...template,
                    title: `${template.title} - ${user.fullname}`,
                    due: dueDate,
                    user: user._id,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random creation date within last 30 days
                });
            }
        });

        const createdTasks = await Task.insertMany(tasks);
        console.log(`✅ Created ${createdTasks.length} tasks.`);

        // Helper function to generate invite code
        const generateInviteCode = () => {
            return Math.random().toString(36).substring(2, 10).toUpperCase();
        };

        // Create sample teams
        const teams = [
            {
                name: "Development Team",
                description: "Core development team working on product features",
                owner: createdUsers[0]._id,
                inviteCode: generateInviteCode(),
                members: [
                    { user: createdUsers[0]._id, role: 'owner', joinedAt: new Date() },
                    { user: createdUsers[1]._id, role: 'admin', joinedAt: new Date() },
                    { user: createdUsers[2]._id, role: 'member', joinedAt: new Date() }
                ],
                isPublic: true
            },
            {
                name: "Design Team",
                description: "UI/UX design and creative team",
                owner: createdUsers[1]._id,
                inviteCode: generateInviteCode(),
                members: [
                    { user: createdUsers[1]._id, role: 'owner', joinedAt: new Date() },
                    { user: createdUsers[3]._id, role: 'admin', joinedAt: new Date() },
                    { user: createdUsers[4]._id, role: 'member', joinedAt: new Date() }
                ],
                isPublic: true
            },
            {
                name: "Marketing Team",
                description: "Marketing and growth team",
                owner: createdUsers[2]._id,
                inviteCode: generateInviteCode(),
                members: [
                    { user: createdUsers[2]._id, role: 'owner', joinedAt: new Date() },
                    { user: createdUsers[0]._id, role: 'member', joinedAt: new Date() }
                ],
                isPublic: false
            }
        ];

        const createdTeams = await Team.insertMany(teams);
        console.log(`✅ Created ${createdTeams.length} teams.`);

        // Create sample projects
        const projects = [
            {
                name: "Taskly Mobile App",
                description: "Mobile application for iOS and Android",
                owner: createdUsers[0]._id,
                team: createdTeams[0]._id,
                status: "active",
                priority: "high",
                endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
                members: [
                    { user: createdUsers[0]._id, role: 'manager', joinedAt: new Date() },
                    { user: createdUsers[1]._id, role: 'manager', joinedAt: new Date() },
                    { user: createdUsers[2]._id, role: 'contributor', joinedAt: new Date() }
                ],
                milestones: [
                    {
                        name: "MVP Release",
                        description: "First version with core features",
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        status: "in-progress"
                    },
                    {
                        name: "Beta Testing",
                        description: "Public beta testing phase",
                        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                        status: "pending"
                    }
                ]
            },
            {
                name: "Website Redesign",
                description: "Complete redesign of company website",
                owner: createdUsers[1]._id,
                team: createdTeams[1]._id,
                status: "active",
                priority: "medium",
                endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                members: [
                    { user: createdUsers[1]._id, role: 'manager', joinedAt: new Date() },
                    { user: createdUsers[3]._id, role: 'manager', joinedAt: new Date() },
                    { user: createdUsers[4]._id, role: 'contributor', joinedAt: new Date() }
                ],
                milestones: [
                    {
                        name: "Design Mockups",
                        description: "Complete all design mockups",
                        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                        status: "completed"
                    }
                ]
            },
            {
                name: "Marketing Campaign Q1",
                description: "Q1 marketing campaign planning and execution",
                owner: createdUsers[2]._id,
                team: createdTeams[2]._id,
                status: "planning",
                priority: "high",
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                members: [
                    { user: createdUsers[2]._id, role: 'manager', joinedAt: new Date() },
                    { user: createdUsers[0]._id, role: 'contributor', joinedAt: new Date() }
                ],
                milestones: []
            },
            {
                name: "API Documentation",
                description: "Comprehensive API documentation for developers",
                owner: createdUsers[0]._id,
                team: createdTeams[0]._id,
                status: "active",
                priority: "medium",
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                members: [
                    { user: createdUsers[0]._id, role: 'manager', joinedAt: new Date() },
                    { user: createdUsers[2]._id, role: 'contributor', joinedAt: new Date() }
                ],
                milestones: []
            }
        ];

        const createdProjects = await Project.insertMany(projects);
        console.log(`✅ Created ${createdProjects.length} projects.`);

        // Display summary
        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`👥 Users: ${createdUsers.length}`);
        console.log(`📋 Tasks: ${createdTasks.length}`);
        console.log(`👥 Teams: ${createdTeams.length}`);
        console.log(`📁 Projects: ${createdProjects.length}`);

        console.log('\n👤 Sample Users (all passwords: "password123"):');
        createdUsers.forEach(user => {
            console.log(`   • ${user.fullname} (${user.username}) - ${user.email}`);
        });

        console.log('\n📋 Task Distribution:');
        for (const user of createdUsers) {
            const userTasks = createdTasks.filter(task => task.user.toString() === user._id.toString());
            const completedTasks = userTasks.filter(task => task.status === 'completed').length;
            const inProgressTasks = userTasks.filter(task => task.status === 'in-progress').length;
            const failedTasks = userTasks.filter(task => task.status === 'failed').length;

            console.log(`   • ${user.fullname}: ${userTasks.length} tasks (${completedTasks} completed, ${inProgressTasks} in-progress, ${failedTasks} failed)`);
        }

        console.log('\n🚀 You can now start the application and login with any of the sample users!');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        console.error(error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed.');
    }
};

// Run the seed function
seedDatabase();