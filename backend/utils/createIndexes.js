import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Team from '../models/Team.js';
import Achievement from '../models/Achievement.js';

/**
 * Create database indexes for optimal performance
 */
export const createIndexes = async () => {
    try {
        //console.log('Creating database indexes...');
        
        // User indexes
        await User.collection.createIndex({ username: 1 }, { unique: true });
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ level: -1 });
        await User.collection.createIndex({ experience: -1 });
        await User.collection.createIndex({ 'stats.productivityScore': -1 });
        await User.collection.createIndex({ 'teams.teamId': 1 });
        await User.collection.createIndex({ created_at: -1 });
        
        // Task indexes
        await Task.collection.createIndex({ user: 1, status: 1 });
        await Task.collection.createIndex({ user: 1, due: 1 });
        await Task.collection.createIndex({ user: 1, priority: 1 });
        await Task.collection.createIndex({ user: 1, archived: 1 });
        await Task.collection.createIndex({ project: 1, status: 1 });
        await Task.collection.createIndex({ assignee: 1, status: 1 });
        await Task.collection.createIndex({ due: 1, status: 1 });
        await Task.collection.createIndex({ tags: 1 });
        await Task.collection.createIndex({ category: 1 });
        await Task.collection.createIndex({ 'recurring.enabled': 1, 'recurring.nextDue': 1 });
        await Task.collection.createIndex({ watchers: 1 });
        await Task.collection.createIndex({ createdAt: -1 });
        
        // Project indexes
        await Project.collection.createIndex({ owner: 1, status: 1 });
        await Project.collection.createIndex({ team: 1, status: 1 });
        await Project.collection.createIndex({ 'members.user': 1 });
        await Project.collection.createIndex({ archived: 1, status: 1 });
        await Project.collection.createIndex({ deadline: 1, status: 1 });
        await Project.collection.createIndex({ tags: 1 });
        await Project.collection.createIndex({ category: 1 });
        await Project.collection.createIndex({ createdAt: -1 });
        
        // Team indexes
        await Team.collection.createIndex({ owner: 1 });
        await Team.collection.createIndex({ 'members.user': 1 });
        await Team.collection.createIndex({ inviteCode: 1 }, { unique: true, sparse: true });
        await Team.collection.createIndex({ archived: 1 });
        await Team.collection.createIndex({ 'settings.visibility': 1 });
        await Team.collection.createIndex({ createdAt: -1 });
        
        // Achievement indexes
        await Achievement.collection.createIndex({ id: 1 }, { unique: true });
        await Achievement.collection.createIndex({ category: 1, rarity: 1 });
        await Achievement.collection.createIndex({ isActive: 1, isSecret: 1 });
        await Achievement.collection.createIndex({ 'availability.startDate': 1, 'availability.endDate': 1 });
        await Achievement.collection.createIndex({ 'series.name': 1, 'series.order': 1 });
        await Achievement.collection.createIndex({ order: 1 });
        
        // Compound indexes for common queries
        await Task.collection.createIndex({ user: 1, status: 1, due: 1 });
        await Task.collection.createIndex({ user: 1, project: 1, status: 1 });
        await Task.collection.createIndex({ assignee: 1, project: 1, status: 1 });
        await Project.collection.createIndex({ owner: 1, archived: 1, status: 1 });
        await Team.collection.createIndex({ 'members.user': 1, archived: 1 });
        
        //console.log('✅ Database indexes created successfully');
        
    } catch (error) {
        //console.error('❌ Error creating database indexes:', error);
        throw error;
    }
};

/**
 * Drop all custom indexes (useful for development)
 */
export const dropIndexes = async () => {
    try {
        //console.log('Dropping custom database indexes...');
        
        const collections = [User, Task, Project, Team, Achievement];
        
        for (const Model of collections) {
            const indexes = await Model.collection.indexes();
            for (const index of indexes) {
                // Skip the default _id index
                if (index.name !== '_id_') {
                    try {
                        await Model.collection.dropIndex(index.name);
                        //console.log(`Dropped index: ${index.name} from ${Model.collection.name}`);
                    } catch (error) {
                        // Index might not exist, continue
                        //console.log(`Index ${index.name} not found in ${Model.collection.name}`);
                    }
                }
            }
        }
        
        //console.log('✅ Custom indexes dropped successfully');
        
    } catch (error) {
        //console.error('❌ Error dropping indexes:', error);
        throw error;
    }
};

/**
 * Get index information for all collections
 */
export const getIndexInfo = async () => {
    try {
        const collections = [
            { name: 'User', model: User },
            { name: 'Task', model: Task },
            { name: 'Project', model: Project },
            { name: 'Team', model: Team },
            { name: 'Achievement', model: Achievement }
        ];
        
        const indexInfo = {};
        
        for (const { name, model } of collections) {
            const indexes = await model.collection.indexes();
            indexInfo[name] = indexes.map(index => ({
                name: index.name,
                key: index.key,
                unique: index.unique || false,
                sparse: index.sparse || false
            }));
        }
        
        return indexInfo;
        
    } catch (error) {
        //console.error('❌ Error getting index information:', error);
        throw error;
    }
};

// CLI usage
if (process.argv[2] === 'create') {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly')
        .then(() => createIndexes())
        .then(() => process.exit(0))
        .catch(error => {
            //console.error(error);
            process.exit(1);
        });
} else if (process.argv[2] === 'drop') {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly')
        .then(() => dropIndexes())
        .then(() => process.exit(0))
        .catch(error => {
            //console.error(error);
            process.exit(1);
        });
} else if (process.argv[2] === 'info') {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly')
        .then(() => getIndexInfo())
        .then(info => {
            //console.log('Database Index Information:');
            //console.log(JSON.stringify(info, null, 2));
            process.exit(0);
        })
        .catch(error => {
            //console.error(error);
            process.exit(1);
        });
}