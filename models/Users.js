const mongoose = require('mongoose')
const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        access_token: { type: String },
        refresh_token: { type: String },
        googleId: { type: String, default: 1 },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("Users", userSchema);
module.exports = User;
