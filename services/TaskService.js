const Task = require('../models/Task');

/**
 * Create a new task
 */
const createTask = async (taskData) => {
    return await Task.create(taskData);
};

const getTaskByName = async (name) => {
    return await Task.findOne({ name });
};

/**
 * Get all tasks with optional search, filter, and sort
 */
const getTasks = async (queryParams) => {
    const { search, priority, status, sortBy } = queryParams;

    let query = {};
    if (search) {
        query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }
    if (priority) {
        query.priority = priority;
    }
    if (status) {
        query.status = status;
    }

    const sortCriteria = sortBy ? { [sortBy]: 1 } : { createdAt: -1 };
    return await Task.find(query).sort(sortCriteria);
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
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    getTaskByName
};
