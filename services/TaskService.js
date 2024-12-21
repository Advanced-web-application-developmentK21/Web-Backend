const Task = require('../models/Task');

/**
 * Create a new task
 */
const createTask = async (taskData) => {
    return await Task.create(taskData);
};

const getTasksByUser = async (userId, queryParams) => {
    const { search, priority, status, sortBy } = queryParams;

    // Filter tasks by userId
    let query = { userId };

    if (search) {
        query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }
    if (priority) {
        query.priority = priority;
    }
    if (status) {
        query.status = status;
    }

    // Sorting criteria
    const sortCriteria = sortBy ? { [sortBy]: 1 } : { createdAt: -1 };

    // Fetch tasks with filters and sorting
    return await Task.find(query).sort(sortCriteria);
};

/**
 * Find a task by name for a specific user
 */
const getTaskByNameAndUser = async (name, userId) => {
    return await Task.findOne({ name, userId });
};

/**
 * Get a single task by ID
 */
const getTaskById = async (id) => {
    return await Task.findById(id);
};

/**
 * Update a task by ID
 */
const updateTask = async (id, updates) => {
    return await Task.findByIdAndUpdate(id, updates, { new: true });
};

/**
 * Delete a task by ID
 */
const deleteTask = async (id) => {
    return await Task.findByIdAndDelete(id);
};

module.exports = {
    createTask,
    getTasksByUser,
    getTaskById,
    updateTask,
    deleteTask,
    getTaskByNameAndUser
};
