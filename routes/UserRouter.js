const express = require('express');
const router = express.Router()
const userController = require('../controllers/UserController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', userController.createUser)
router.post('/login', userController.loginUser)

router.put('/update-user/:id', userController.updateUser)

router.get('/profile/:id', authMiddleware(), userController.getDetailsUser)

router.post('/refresh-token', userController.refreshToken),

module.exports = router