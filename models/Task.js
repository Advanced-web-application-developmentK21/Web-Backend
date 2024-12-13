const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
        estimatedTime: { type: Number }, // Time in hours
        status: { type: String, enum: ['Todo', 'In Progress', 'Completed', 'Expired'], default: 'Todo' },
        startDate: { type: Date},
        dueDate: { type: Date }, // Optional deadline or scheduling
    },
    {
        timestamps: true,
    }
);

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
