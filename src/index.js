require('dotenv').config()
require('./db/mongoose') //Ensure that the file runs
const express = require('express');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

app.use(express.json()); //This automatically parse JSON as an object
app.use(userRouter);
app.use(taskRouter);

app.listen(port, ()=>{
    console.log(`Server is up on port ${port}`);
});