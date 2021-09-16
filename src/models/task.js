const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({ 
    description: {
        type: String,
        required: true,
        trim: true
    }, 
    completed: {
        type: Boolean,
        default: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' //Ref allows us to make the relationship in mongoose
    }
},{
    timestamps: true
});

const Task = mongoose.model('Task',taskSchema)

module.exports = Task;