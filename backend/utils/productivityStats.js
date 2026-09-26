import Task from "../models/Task.js";

// Calculate Productivity Stats (Reusable Functionality)
const fetchTaskCounts = async (userId, status) => {
    return await Task.countDocuments({user: userId, status});
};

const fetchCompletedTasksWithTime = async (userId) => {
    return await Task.find({user: userId, status: "completed"}, {createdAt: 1, updatedAt: 1});
};

const calculateAverageCompletionTime = (completedTasks) => {
    const totalDuration = completedTasks.reduce((acc, task) => acc + (task.updatedAt - task.createdAt), 0);
    return completedTasks.length > 0
        ? (totalDuration / completedTasks.length) / (60 * 60 * 1000) // Convert to hours
        : 0;
};

const calculateCompletionRate = (completed, failed) => {
    const total = completed + failed;
    return total > 0 ? ((completed / total) * 100).toFixed(2) : 0;
};

const calculateCompletionStreak = async (userId) => {
    const completedTasks = await Task.find({user: userId, status: "completed"})
        .sort({updatedAt: -1})
        .distinct("updatedAt");

    if (completedTasks.length === 0) return 0;

    const dates = completedTasks
        .map((time) => new Date(time).toISOString().split("T")[0])
        .filter((day, i, arr) => !i || arr[i - 1] === day);

    let streak = 1;

    for (let i = 1; i < dates.length; i++) {
        if (new Date(dates[i - 1]) - new Date(dates[i]) === 86400000) streak++;
        else break;
    }

    return streak;
};

// Consolidated Function to Calculate Productivity Stats
const calculateProductivityStats = async (userId) => {
    try {
        const completed = await fetchTaskCounts(userId, "completed");
        const failed = await fetchTaskCounts(userId, "failed");
        const inProgress = await fetchTaskCounts(userId, "in-progress");
        const completedTasks = await fetchCompletedTasksWithTime(userId);

        const streak = await calculateCompletionStreak(userId);
        const avgCompletionTime = calculateAverageCompletionTime(completedTasks);
        const completionRate = calculateCompletionRate(completed, failed);

        return {
            completed,
            failed,
            streak,
            avgTime: `${avgCompletionTime.toFixed(2)} hrs`,
            completionRate: `${completionRate}`,
            ongoing: inProgress,
        };
    } catch (error) {
        //console.error("Error calculating productivity stats:", error);
        throw new Error("Unable to fetch productivity stats.");
    }
};

export {
    calculateProductivityStats,
};