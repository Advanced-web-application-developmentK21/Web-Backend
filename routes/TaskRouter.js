const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');

router.post('/createTasks/:userId', TaskController.createTask);
router.get('/getOptionTasks/:userId', TaskController.getTasks);
router.get('/getTasks/:id', TaskController.getTaskById);
router.put('/updateTasks/:id', TaskController.updateTask);
router.delete('/deleteTasks/:id', TaskController.deleteTask);
router.post('/analyze-schedule', TaskController.analyze_schedule);
router.post('/suggest', TaskController.suggest_task);
router.get('/daily-time-spent/:userId', TaskController.getDailyTimeSpentData);
router.get('/dashboard/:userId', TaskController.getDashboard);
router.get('/task-status/:userId', TaskController.getTaskStatus);
router.post('/ai-feedback/:userId', TaskController.getAIFeedback);
router.post('/chatbot-ask/:userId', TaskController.chatbotQNA);

module.exports = router;
