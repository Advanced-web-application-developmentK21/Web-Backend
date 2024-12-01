const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = () => (req, res, next) => {
    const authHeader = req.headers['authorization'];  // Look for the 'authorization' header
    if (!authHeader) {
        return res.status(401).json({
            message: 'Access token is missing',
            status: 'ERR'
        });
    }

    // Assuming token is sent as "Bearer <token>"
    const token = authHeader.split(' ')[1];  
    if (!token) {
        return res.status(401).json({
            message: 'Bearer token is missing',
            status: 'ERR'
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) {
            return res.status(401).json({
                message: 'Access token has expired or is invalid',
                status: 'ERR'
            });
        }

        req.user = user.payload;  // Attach user info to request
        next();  // Proceed to the next middleware/route handler
    });
};


module.exports = {
    authMiddleware,
};
