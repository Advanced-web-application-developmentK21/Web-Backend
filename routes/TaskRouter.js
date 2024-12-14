const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');

router.post('/createTasks', TaskController.createTask);
router.get('/getOptionTasks', TaskController.getTasks);
router.get('/getTasks/:id', TaskController.getTaskById);
router.put('/updateTasks/:id', TaskController.updateTask);
router.delete('/deleteTasks/:id', TaskController.deleteTask);
router.post('/analyze-schedule', TaskController.analyze_schedule);

module.exports = router;
