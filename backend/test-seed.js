import mongoose from "mongoose";
import Task from "./models/Task.js";
import User from "./models/User.js";

// Test connection and basic operations
const testSeed = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/taskly');
        console.log('✅ MongoDB connected successfully.');
        
        // Test creating a simple task
        const testUser = new User({
            fullname: "Test User",
            username: "testuser",
            email: "test@example.com",
            password: "password123"
        });
        
        await testUser.save();
        console.log('✅ Test user created successfully.');
        
        const testTask = new Task({
            title: "Test Task",
            description: "This is a test task",
            due: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            priority: "medium",
            tags: ["test"],
            status: "in-progress",
            user: testUser._id
        });
        
        await testTask.save();
        console.log('✅ Test task created successfully.');
        
        // Clean up
        await Task.deleteOne({ _id: testTask._id });
        await User.deleteOne({ _id: testUser._id });
        console.log('✅ Test data cleaned up.');
        
        console.log('🎉 All tests passed! Seed should work correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        mongoose.connection.close();
    }
};

testSeed();