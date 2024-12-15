const TaskService = require('../services/TaskService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.error('Missing API key. Please set GENERATIVE_AI_API_KEY in your .env file.');
  process.exit(1);
}

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        // Validate that startDate and dueDate are provided
        if (updates.startDate && !updates.dueDate) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Both startDate and dueDate are required.',
            });
        }

        // Validate that dueDate is after startDate
        if (updates.startDate && updates.dueDate && new Date(updates.dueDate) <= new Date(updates.startDate)) {
            return res.status(400).json({
                status: 'ERR',
                message: 'dueDate must be after startDate.',
            });
        }

        const now = new Date();

        // Validate status based on startDate and dueDate
        if (updates.status === 'Todo' && updates.startDate && new Date(updates.startDate) <= now) {
            return res.status(400).json({
                status: 'ERR',
                message: 'startDate must be in the future for status "Todo".',
            });
        }

        if (updates.status === 'In Progress' && updates.startDate && new Date(updates.startDate) > now) {
            return res.status(400).json({
                status: 'ERR',
                message: 'startDate must be today or in the past for status "In Progress".',
            });
        }

        if (updates.status === 'Completed' && (updates.dueDate && new Date(updates.dueDate) > now || updates.startDate && new Date(updates.startDate) > now)) {
            return res.status(400).json({
                status: 'ERR',
                message: 'startDate and dueDate must be in the past for status "Completed".',
            });
        }

        if (updates.status === 'Expired' && updates.dueDate && new Date(updates.dueDate) >= now) {
            return res.status(400).json({
                status: 'ERR',
                message: 'dueDate must be in the past for status "Expired".',
            });
        }

        // Check if task exists to update
        const existingTask = await TaskService.getTaskById(id);
        if (!existingTask) {
            return res.status(404).json({ status: 'ERR', message: 'Task not found' });
        }

        // Update the task
        const updatedTask = await TaskService.updateTask(id, updates);

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

const analyze_schedule = async (req, res) => {
    const { calendarEvents } = req.body;

    // Validate input
    if (!calendarEvents || !Array.isArray(calendarEvents)) {
        return res.status(400).json({ error: 'calendarEvents must be a non-empty array of task data.' });
    }

    // Helper function to create the prompt
    const createPrompt = (events) => `
        Analyze the following tasks:
        ${events
            .map((task) => `
            - Id: ${task.id}, 
              All Day: ${task.allDay}, 
              Description: ${task.desc}, 
              End: ${task.end}, 
              Estimated Time: ${task.estimatedTime || 'Not Scheduled'}, 
              Priority: ${task.priority}, 
              Status: ${task.status}, 
              Title: ${task.title}`)
            .join('\n')}
        Provide feedback on this schedule, including warnings about tight schedules and recommendations for prioritization and balance, along with Simple Steps to Fix. Keep the feedback concise and easy to understand.
         You should give the short and easy to understand as much as possible please.
    `;

    const prompt = createPrompt(calendarEvents);

    try {
        // Initialize the generative model
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
        });

        const generationConfig = {
            temperature: 2,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "text/plain",
        };

        // Start the chat session
        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: "user",
                    parts: [
                        {
                            text: "Analyze the following tasks and provide optimization suggestions.",
                        },
                    ],
                },
            ],
        });

        console.log('Generated Prompt:', prompt);

        // Send the prompt to the model
        const result = await chatSession.sendMessage(prompt);

        if (result.response.text()) {
            res.json({ feedback: result.response.text() });
        } else {
            res.json({ feedback: 'No feedback provided by the AI model.' });
        }
    } catch (error) {
        console.error('Error analyzing schedule:', error);
        res.status(500).json({ error: 'An error occurred while analyzing the schedule. Please try again later.' });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    analyze_schedule,