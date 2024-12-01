const UserService = require('../services/UserService')
const JwtService = require('../services/JwtService')

const createUser = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        const isCheckEmail = reg.test(email);

        // Regular expression for password validation
        const passwordReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const isValidPassword = passwordReg.test(password);

        if (!username && !email && !password && !confirmPassword) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Please input your information',
            });
        } else if (!username) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Please input your username',
            });
        } else if (!email) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Please input your email',
            });
        } else if (!password) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Please input your password',
            });
        } else if (!isCheckEmail) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Email format is invalid. Please check the email and try again.',
            });
        } else if (!isValidPassword) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.',
            });
        } else if (password !== confirmPassword) {
            return res.status(404).json({
                status: 'ERR',
                message: "Passwords don't match. Please try again.",
            });
        }

        const response = await UserService.createUser(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e,
        });
    }
};


const loginUser= async(req,res)=>{
    try{
        const {email, password} = req.body
        const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
        const isCheckEmail = reg.test(email)

        if(!email && !password ){
            return res.status(404).json({
                status: 'ERR',
                message: 'Please input your email and password'
            })
        } else if(!email){
            return res.status(404).json({
                status: 'ERR',
                message: 'Please input your email'
            })
        } else if(!password){
            return res.status(404).json({
                status: 'ERR',
                message: 'Please input your password'
            })
        } else if(!isCheckEmail) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Email format is invalid. Please check the email and try again.'
            })
        }
        const response = await UserService.loginUser(req.body)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const updateUser = async(req,res)=>{
    try{
        const userId = req.params.id
        const data = req.body
        if(!userId){
            return res.status(404).json({
                status: 'ERR', 
                message: 'The userId is required'
            })
        }

        const response = await UserService.updateUser(userId, data)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const getDetailsUser = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(404).json({
                status: 'ERR', 
                message: 'The userId is required'
            });
        }

        const response = await UserService.getDetailsUser(id);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || e,
        });
    }
};

const refreshToken = async(req,res)=>{
    try{
        const token = req.headers.token.split(' ')[1]
        if(!token){
            return res.status(404).json({
                status: 'ERR', 
                message: 'The token is required'
            })
        }

        const response = await JwtService.refreshTokenJwtService(token)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const logoutUser = async (req, res) => {
    try {
        const userId = req.params.id

        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized. User ID is missing.',
            });
        }

        const response = await UserService.logoutUser(userId);
        return res.status(200).json(response);
    } catch (e) {
        console.error('Error during logout: ', e);
        return res.status(500).json({
            status: 'ERR',
            message: e.message || 'An error occurred during logout',
        });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Validate input
        if (!email || !username || !password) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Email, username, and password are required.',
            });
        }

        // Regular expression for password validation
        const passwordReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const isValidPassword = passwordReg.test(password);

        if (!isValidPassword) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.',
            });
        }

        const response = await UserService.updatePassword(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e.message || e,
        });
    }
};


module.exports = {
    createUser,
    loginUser,
    updateUser,
    getDetailsUser,
    refreshToken,
    logoutUser,
    updatePassword
}