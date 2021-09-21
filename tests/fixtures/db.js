const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneId,
    name: "Jesus Israel Guzman Armenta",
    email: "jesus.i.guzman.a@gmail.com",
    password: "He1rqwsadeq",
    tokens: [{
        token: jwt.sign({_id: userOneId},process.env.JWT_SECRET)
    }]
}

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
    _id: userTwoId,
    name: "Hernan Ignacio Xacana",
    email: "Skitte@example.com",
    password: "112aa8ew1{",
    tokens: [{
        token: jwt.sign({_id: userTwoId},process.env.JWT_SECRET)
    }]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Terminar el curso csmre',
    completed: false,
    author: userOneId
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Jugar TFT',
    completed: false,
    author: userOneId
}


const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Obtener llamada de Bosch',
    author: userTwoId,
    completed: true
}

const setupDB = async() => {
    await User.deleteMany();
    await Task.deleteMany();
    await new User(userOne).save();
    await new User(userTwo).save();
    await new Task(taskOne).save();
    await new Task(taskTwo).save();
    await new Task(taskThree).save();
}

module.exports = {
    userOneId,
    userOne,
    userTwo,
    userTwoId,
    taskOne,
    taskTwo,
    taskThree,
    setupDB
}