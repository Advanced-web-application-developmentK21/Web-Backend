const Task = require('../models/Task');
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
        const { userId } = req.params; // Extract userId from params
        const { name, description, priority, status, startDate, dueDate } = req.body;

        if (!startDate || !dueDate) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Both startDate and dueDate are required.',
            });
        }

        const now = new Date();

        if (new Date(dueDate) <= new Date(startDate)) {
            return res.status(400).json({
                status: 'ERR',
                message: 'dueDate must be after startDate.',
            });
        }

        // Check if a task with the same name exists for the given user
        const existingTask = await Task.findOne({ name, userId });
        if (existingTask) {
            return res.status(409).json({
                status: 'ERR',
                message: 'Task with the same name already exists for this user.',
            });
        }

        const estimatedTime = Math.ceil((new Date(dueDate) - new Date(startDate)) / (1000 * 60 * 60));

        const newTask = await Task.create({
            userId,
            name,
            description,
            priority,
            estimatedTime,
            status: status || 'Todo',
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
        const { userId } = req.params; // Get userId from params or middleware
        const tasks = await TaskService.getTasksByUser(userId, req.query);

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
              All Day: ${task.allDay}, 
              Description: ${task.desc}, 
              End: ${task.end}, 
              Estimated Time: ${task.estimatedTime || 'Not Scheduled'}, 
              Priority: ${task.priority}, 
              Status: ${task.status}, 
              Title: ${task.title}`)
            .join('\n')}
        Provide feedback on this schedule with the following include 
        Warnings: Identify at least three tasks that are too tightly scheduled, have conflicts, or could cause problems. Make sure to highlight at least three issues.
        Prioritization Recommendations: Advise on which tasks should be prioritized and balanced;
        Simple Steps to Fix: Suggest quick fixes to improve the schedule, such as moving or extending tasks, or adjusting priorities. Keep the feedback concise and easy to understand.
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

const getDailyTimeSpentData = async (req, res) => {
    const { userId } = req.params; // Extract userId from URL parameters
    const { startDate } = req.query; // Extract the start date from the query string

    try {
        // Pass the userId and startDate to the service
        const dailyData = await TaskService.getDailyTimeSpent(userId, startDate);
        res.json(dailyData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data' });
    }
};

const getDashboard = async (req, res) => {
    const { userId } = req.params;

    try {
        const dashboardData = await TaskService.getDashboardData(userId);
        res.status(200).json(dashboardData);
    } catch (error) {
        console.error(error); // Log error message to help with debugging
        res.status(500).json({ message: error.message });
    }
};

const getTaskStatus = async (req, res) => {
    const { userId } = req.params; // Get userId from params

    try {
        console.log('Fetching task status for userId:', userId); // Debugging line

        // Call the service to get task status counts
        const taskStatusData = await TaskService.getTaskStatusCounts(userId);

        // Send response with task status data
        res.status(200).json({
            labels: ['Todo', 'In Progress', 'Completed', 'Expired'],
            datasets: [
                {
                    data: [
                        taskStatusData.Todo,
                        taskStatusData['In Progress'],
                        taskStatusData.Completed,
                        taskStatusData.Expired,
                    ],
                    backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'],
                    hoverOffset: 10,
                },
            ],
        });
    } catch (error) {
        console.error('Error in getTaskStatus controller:', error); // Debugging line
        res.status(500).json({ message: error.message });
    }
};

const getAIFeedback = async (req, res) => {
    const { userId } = req.params;

    // Validate input
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        // Fetch tasks for the user
        const tasks = await TaskService.getTasksByUser(userId, req.query);

        if (!tasks || tasks.length === 0) {
            return res.status(404).json({ error: 'No tasks found for the user.' });
        }

        // Helper function to create the prompt for feedback generation
        const createPrompt = (tasks) => `
Analyze the following tasks in detail:
${tasks
                .map((task, index) => `
    Task ${index + 1}: 
    - Title: ${task.title}
    - Description: ${task.desc}
    - All Day: ${task.allDay}
    - End: ${task.end}
    - Estimated Time: ${task.estimatedTime || 'Not Scheduled'}
    - Priority: ${task.priority}
    - Status: ${task.status}
    `)
                .join('\n')}

Please provide detailed feedback in the following sections, ensuring that you reference the specific tasks where applicable:

1. **Areas of Excellence**:
    - Identify tasks or aspects where the user is excelling.
    - Provide clear examples of excellence in task management, referencing specific tasks (e.g., "Task 1: [Task Title] was completed on time and with exceptional quality").
    - Highlight at least five things the user is doing well, such as meeting deadlines, prioritizing well, successfully completing tasks, or handling unexpected issues effectively.

2. **Tasks Needing Attention**:
    - Suggest at least five tasks or areas that may need more attention or could be improved.
    - Point out tasks that have issues such as conflicts, delays, lack of progress, or unclear scheduling, referencing the specific task (e.g., "Task 3: [Task Title] has missed its deadline and needs clearer scheduling").
    - Offer suggestions for improvement for each task.

3. **Motivational Feedback**:
    - Offer motivational feedback to encourage consistency and improvement.
    - Provide at least five pieces of advice to help the user stay motivated, manage their time better, or improve their task completion rate.
    - Provide specific advice based on tasks, such as "For Task 2: [Task Title], breaking down the task into smaller steps could help manage it more effectively."
`;

        const prompt = createPrompt(tasks);

        // Initialize the generative model
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash', // Use the appropriate AI model for the task
        });

        const generationConfig = {
            temperature: 0.7, // Moderate temperature to get balanced results
            topP: 0.9,
            topK: 50,
            maxOutputTokens: 8192,
            responseMimeType: 'text/plain',
        };

        // Start a chat session
        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: 'Analyze the following tasks and provide detailed feedback on areas of excellence, improvement, and motivational advice. Ensure each section contains as many points as possible, but at least 5 items for each section.',
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
        console.error('Error fetching AI feedback:', error);
        res.status(500).json({ error: 'An error occurred while generating AI feedback. Please try again later.' });
    }
};


module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    analyze_schedule,
    getDailyTimeSpentData,
    getDashboard,
    getTaskStatus,
    getAIFeedback,
};