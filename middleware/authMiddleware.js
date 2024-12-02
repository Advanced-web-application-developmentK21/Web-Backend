const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/Users'); 

// Authentication middleware
const authMiddleware = () => (req, res, next) => {
    const authHeader = req.headers['authorization']; // Look for the 'Authorization' header
    if (!authHeader) {
        return res.status(401).json({
            message: 'Access token is missing',
            status: 'ERR'
        });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            message: 'Bearer token is missing',
            status: 'ERR'
        });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                message: 'Access token is invalid or expired',
                status: 'ERR'
            });
        }

        req.user = decoded; // Attach decoded user info to request
        next(); // Proceed to the next middleware/route handler
    });
};

// Google OAuth2 strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'https://web-backend-q0is.onrender.com/user/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if the user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // If the user doesn't exist, create a new one
                    user = await User.create({
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        password: "Abcde12345@", // No password needed for Google login
                    });
                } else {
                    // If user exists, update the user record (avoid overwriting password)
                    user.email = profile.emails[0].value;
                    user.username = profile.displayName;
                    user.googleId = profile.id;
                    await user.save();
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);


// Serialize user for session
passport.serializeUser((user, done) => done(null, user.id));

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = {
    authMiddleware,
    passport
};
