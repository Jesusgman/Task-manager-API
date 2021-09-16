const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, async (req,res)=>{
    const task = new Task({
        ...req.body, //This sends all the information from the body
        author: req.user._id})
    try{
        await task.save();
        res.status(201).send(task);
    }catch(e){
        res.status(400).send(e);
    }
    
    /* task.save().then((data)=>{
        res.status(201).send(task);
    }).catch((error)=>{
        res.status(400).send(error);
     });*/
});

//GET tasks?limit=10&skip=10 Limit # of tasks to return
//skip the amount to skip to display the next page
//GET /tasks?sortBy=createdAt_asc
router.get('/tasks',auth, async (req,res)=>{
    //With populate

    const match = {};
    const sort = {};
    const completedStatus = req.query.completed;
    console.log(req.query)
    if(completedStatus){
        match.completed = completedStatus === 'true'
    }
    const sortByParam = req.query.sortBy;
    if(sortByParam){
        let params = sortByParam.split('_');
        sort[params[0]] = params[1]==='asc' ? 1 : -1
    }
    try{
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send(e.message)
    }
    //With await
/*     try{
        const tasks = await Task.find({author: req.user._id});
        res.status(201).send(tasks);
    }catch(e){
        res.status(500).send(e.message);
    } */
/*  Promises using then   
    Task.find({}).then((tasks)=>{
        res.status(201).send(tasks);
    }).catch((err)=>{
        res.status(500).send();
    }); */
});

router.get('/tasks/:id',auth,async (req,res)=>{
    const _id = req.params.id;
    try{
        //Find one when multiple fields are required
        const task = await Task.findOne({_id, author: req.user._id});
        if(!task){
            return res.status(404).send('Task not found'); //to avoid the code bellow from executing
        }
        res.status(201).send(task);
    }catch(e){
        res.status(500).send(e.message);
    }
/*     Task.findById(_id).then((task)=>{
        if(!task){
            return res.status(404).send('Task not found');
        }
        res.status(201).send(task);
    }).catch((err)=>{
        res.status(500).send();
    }); */
});

router.patch('/tasks/:id', auth, async (req,res)=>{
    const newValues = req.body;
    const validAttr = ['description', 'completed']
    const incUpdates = Object.keys(newValues);
    const isValidReq = await incUpdates.every((update)=>validAttr.includes(update));
    if(!isValidReq){
        return res.status(400).send({error:"Invalid operation!"});
    } 
    try{
        const updatedTsk = await Task.findOne({_id: req.params.id, author: req.user._id});
        //const updatedTsk = await Task.findByIdAndUpdate(req.params.id,newValues,{new: true, runValidators: true});
        if(!updatedTsk){
            return res.status(404).send('Task was not found!');
        }
        incUpdates.forEach((update)=>{
            updatedTsk[update] = req.body[update];
        });
        await updatedTsk.save();
        //For a 200 no need to send a status code
        res.send(updatedTsk);
    }catch(e){
        res.status(400).send(e.message);
    }
});

router.delete('/tasks/:id', auth, async (req,res)=>{
    try {
        const deletedTsk = await Task.findOneAndDelete({_id: req.params.id, author: req.user._id});
        if(!deletedTsk){
            return res.status(404).send('Task not found!');
        }
        res.send(deletedTsk);
    }catch(e){
        res.status(500).send(e.message);
    }
});

module.exports = router;