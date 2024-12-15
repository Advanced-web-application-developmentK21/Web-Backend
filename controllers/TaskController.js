const TaskService = require('../services/TaskService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load Gemini API key from environment variables
const GEMINI_API_KEY = 'AIzaSyCS9VKWYHNz-eHFuIEUsagPLa_XFghzE5w';

if (!GEMINI_API_KEY) {
  console.error('Missing API key. Please set GENERATIVE_AI_API_KEY in your .env file.');
  process.exit(1);
}

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
    if (!calendarEvents || !Array.isArray(calendarEvents)) {
        return res.status(400).json({ error: 'Tasks and schedule data are required and must be an array.' });
    }

    // Generate the prompt from tasks and schedule
    const prompt = `
    Analyze the following tasks:
    ${calendarEvents
        .map(
        (task) =>
            `- Id: ${task.id}, allDay: ${task.allDay}, desc: ${task.desc} end: ${task.end}, Estimated Time: ${task.estimatedTime || 'Not Scheduled'}, Priority: ${task.priority}, Status: ${task.status}, Title: ${task.title}`
        )
        .join('\n')}
    Provide Feedback for this schedule includes warnings about tight schedules and prioritization recommendations, Simple Steps to Fix for balance and focus.
    You should give the short and easy to understand as much as possible please.
    `;

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
                {text: "Analyze the following tasks:\ntasksAndSchedule = [\n    { \n      name: \"Math Assignment\", \n      priority: \"High\", \n      estimatedTime: 120, \n      status: \"Todo\",\n      scheduledTime: \"2024-12-10 10:00\" \n    },\n    { \n      name: \"Science Project\", \n      priority: \"Medium\", \n      estimatedTime: 90, \n      status: \"In Progress\",\n      scheduledTime: \"2024-12-10 14:00\" \n    },\n    { \n      name: \"History Notes\", \n      priority: \"Low\", \n      estimatedTime: 60, \n      status: \"Todo\",\n      scheduledTime: null // Or undefined, indicating it's not yet scheduled\n    },\n]\n\nProvide suggestions for optimizing the schedule, such as:\n    - Identifying potential conflicts or overbooking\n    - Suggesting task reordering or time allocation adjustments\n    - Providing tips for better time management and productivity"},
              ],
            },
            {
              role: "model",
              parts: [
                {text: "Analyzing the provided `tasksAndSchedule`, we can see a few scheduling issues and opportunities for optimization:\n\n\n**Potential Conflicts/Overbooking:**\n\n* **Time Conflict:** The scheduled times for \"Math Assignment\" (2 hours, starting at 10:00) and \"Science Project\" (1.5 hours, starting at 14:00) appear non-overlapping.  However, if the estimated times are *not* accurate representations and end up exceeding estimates this would easily lead to clashes, meaning \"Math Assignment\" taking longer than 2 hours and conflicting with \"Science Project.\"  Buffer time is absent.\n\n* **No Scheduling for Low-Priority Task:** The \"History Notes\" task is not scheduled (`scheduledTime: null`). While it has the lowest priority, it still needs to be accounted for in any realistic time management strategy.  It would easily be bumped down into lower slots, creating further problems\n\n**Suggestions for Optimization:**\n\n\n1. **Realistic Time Estimates:** The most important aspect to adjust is estimating the time. If tasks tend to go over estimate, apply the following solutions and possibly inflate initial estimates by 20% or even 50%.\n\n2. **Incorporate Buffer Time:** Add buffer time between tasks (e.g., 15-30 minutes). This time could accommodate unforeseen delays or unexpected issues.  Over time, such padding dramatically reduces issues. This will become especially useful during re-scheduling and conflict management.\n\n3. **Re-order Tasks:** Consider prioritizing tasks by deadline as well as priority. There is currently no insight on a timeline on the task which has priority value as its biggest component (along with other considerations).\n\n4. **Prioritize based on Deadline & Urgency:** Prioritize by deadline if that is something that is missing (with urgency and complexity) as \"high\" and \"medium\" don't adequately account for an important element of task completion: its upcoming due date.\n\n5. **Time Blocking (with Time Constraints):**   If you want to stick to \"2024-12-10\", you must account for total hours across the entire day (in this case, we should assume only around 7 - 12 hours are productive - as people will take rest periods etc). Time blocking forces you to allocate the correct timeframe for the completion of this set of tasks.  It is clear, through estimation of tasks alone that this schedule will require more than 7-12 productive hours in a day.\n\n\n**Improved Schedule Example (Illustrative):**\n\n\nThis example shows possible adjustments to ensure realistic estimation. I am inflating estimates, accounting for breaks, applying prioritizing techniques. Note the ordering differences; these are not explicitly given as its not possible to calculate task priorities based on values you provided.\n\n\n\nLet's assume a workday from 8:00 to 17:00 with an additional hour added for completion, buffer and potential overshoot\n\n\n```\n8:00 - 10:00: Math Assignment (2 hours + 0 hours break)\n10:00 - 10:30: Break\n10:30 - 12:30: Science Project (2 hours + 0.30 hours Break)\n12:30 - 13:30: Lunch Break\n13:30 - 14:30: History Notes (1 hours + 0.30 hours buffer) \n14:30 - 17:30: Flexible work/Additional buffer \n```\n\n\n**Time Management & Productivity Tips:**\n\n* **Pomodoro Technique:** Work in focused bursts (e.g., 25 minutes) with short breaks in between.  This improves concentration and prevents burnout.  This allows for shorter concentration durations which become valuable as time is spent.\n\n* **Timeboxing:** Allocate a specific time block for each task. This avoids task creep where you may end up spending far too long on individual tasks\n\n* **Eliminate Distractions:** Minimize interruptions to keep you on track. The biggest timesink for many are constant diversions. Minimizing this alone has massive value in scheduling\n\n\nBy employing better estimate creation techniques and time blocking in relation to deadlines/constraints you dramatically increase the value of task completion\n\n\nRemember that the above is a suggestion and other considerations (deadlines, complexity) might lead to alternate priorities in practice.   The suggested adjustments make time more manageable without leaving work till the final hour!  It should also account for break periods;  people cannot remain productive at maximal concentration all day, even under an imposed, time-critical scenario!\n"},
              ],
            },
          ],
        });
        console.log(prompt);
    
        const result = await chatSession.sendMessage(prompt);
    
        console.log(result.response.text());// Log the response for debugging
    
        if (result.response.text()) {
          res.json({ feedback: result.response.text() });
        } else {
          res.json({ feedback: 'No feedback provided.' });
        }
      } catch (error) {
        console.error('Error analyzing schedule:', error.message || error);
        res.status(500).json({ error: 'Failed to analyze schedule.' });
      }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    analyze_schedule,
};
