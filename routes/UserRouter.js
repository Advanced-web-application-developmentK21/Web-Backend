const express = require('express');
const router = express.Router()
const userController = require('../controllers/UserController');
const { authMiddleware } = require('../middleware/authMiddleware');
const passport = require('passport');

router.post('/register', userController.createUser)
router.post('/login', userController.loginUser)

router.put('/update-user/:id', authMiddleware(), userController.updateUser)

router.get('/profile/:id', authMiddleware(), userController.getDetailsUser)

router.post('/refresh-token', userController.refreshToken),

router.post('/logout/:id', authMiddleware(), userController.logoutUser);

router.post('/update-password', userController.updatePassword);

router.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

const nodemailer = require('nodemailer');
const { generateVerificationCode, saveVerificationCode } = require('../utils/verificationUtils');

router.get(
    '/auth/google/callback',
    passport.authenticate('google', { session: false }),
    async (req, res) => {
        const user = req.user; // User info from GoogleStrategy

        // Step 1: Generate verification code
        const verificationCode = generateVerificationCode();

        // Step 2: Save code in the database or memory
        await saveVerificationCode(user.email, verificationCode);

        // Step 3: Send the code via email
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use your email provider
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS, // Your email password or app password
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Verification Code',
            text: `Your verification code is: ${verificationCode}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Failed to send verification code' });
            }
            console.log('Email sent:', info.response);
        });

        // Redirect user to a verification page
        //res.redirect(`http://localhost:3000/verify-email?email=${user.email}`);
        res.redirect(`http://localhost:3000/google-login-success?email=${user.email}&username=${user.username}`);
    }
);

router.post('/verify-email', async (req, res) => {
    const { email, code } = req.body;

    // Step 4: Verify the code
    const isValid = await verifyCode(email, code);
    if (!isValid) {
        return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Email verified successfully
    res.json({ message: 'Email verified successfully!' });
    const user = req.user; // Lấy thông tin user từ GoogleStrategy
    res.redirect(`http://localhost:3000/google-login-success?email=${user.email}&username=${user.username}`);
});


module.exports = router