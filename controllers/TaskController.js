const TaskService = require('../services/TaskService');

/**
 * Create a new task
 */
const createTask = async (req, res) => {
    try {
        const { name, description, priority, status, startDate, dueDate } = req.body;

        // Validate that startDate and dueDate are provided
        if (!startDate || !dueDate) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Both startDate and dueDate are required.',
            });
        }

        const now = new Date();

        // Validate that dueDate is after startDate
        if (new Date(dueDate) <= new Date(startDate)) {
            return res.status(400).json({
                status: 'ERR',
                message: 'dueDate must be after startDate.',
            });
        }

        // Validate status based on startDate and dueDate
        if (status === 'Todo' && new Date(startDate) <= now) {
            return res.status(400).json({
                status: 'ERR',
                message: 'startDate must be in the future for status "Todo".',
            });
        }

        if (status === 'In Progress' && new Date(startDate) > now) {
            return res.status(400).json({
                status: 'ERR',
                message: 'startDate must be today or in the past for status "In Progress".',
            });
        }

        if (status === 'Completed' && (new Date(dueDate) > now || new Date(startDate) > now)) {
            return res.status(400).json({
                status: 'ERR',
                message: 'startDate and dueDate must be in the past for status "Completed".',
            });
        }

        if (status === 'Expired' && new Date(dueDate) >= now) {
            return res.status(400).json({
                status: 'ERR',
                message: 'dueDate must be in the past for status "Expired".',
            });
        }

        // Check if task with the same name exists
        const existingTask = await TaskService.getTaskByName(name);
        if (existingTask) {
            return res.status(409).json({
                status: 'ERR',
                message: 'Task with the same name already exists',
            });
        }

        // Calculate estimatedTime (in hours)
        const estimatedTime = Math.ceil(
            (new Date(dueDate) - new Date(startDate)) / (1000 * 60 * 60)
        );

        const newTask = await TaskService.createTask({
            name,
            description,
            priority,
            estimatedTime,
            status: status || 'Todo', // Default to 'Todo' if not provided
            startDate,
            dueDate,
        });

        return res.status(200).json({
            status: 'SUCCESS',
            data: newTask,
        });
    } catch (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ status: 'ERR', message: 'Failed to create task' });
    }
};

/**
 * Get all tasks with optional search, filter, and sort
 */
const getTasks = async (req, res) => {
    try {
        const tasks = await TaskService.getTasks(req.query);

        return res.status(200).json({
            status: 'SUCCESS',
            data: tasks,
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return res.status(500).json({ status: 'ERR', message: 'Failed to fetch tasks' });
    }
};

/**
 * Get a single task by ID
 */
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await TaskService.getTaskById(id);

        if (!task) {
            return res.status(404).json({ status: 'ERR', message: 'Task not found' });
        }

        return res.status(200).json({
            status: 'SUCCESS',
            data: task,
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        return res.status(500).json({ status: 'ERR', message: 'Failed to fetch task' });
    }
};

/**
 * Update a task by ID
 */
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedTask = await TaskService.updateTask(id, updates);

        if (!updatedTask) {
            return res.status(404).json({ status: 'ERR', message: 'Task not found' });
        }

        return res.status(200).json({
            status: 'SUCCESS',
            data: updatedTask,
        });
    } catch (error) {
        console.error('Error updating task:', error);
        return res.status(500).json({ status: 'ERR', message: 'Failed to update task' });
    }
};

/**
 * Delete a task by ID
 */
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedTask = await TaskService.deleteTask(id);

        if (!deletedTask) {
            return res.status(404).json({ status: 'ERR', message: 'Task not found' });
        }

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'Task deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        return res.status(500).json({ status: 'ERR', message: 'Failed to delete task' });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
};
