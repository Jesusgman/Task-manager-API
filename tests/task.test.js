const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const {userOne, userTwo, taskOne, setupDB, taskThree} = require('./fixtures/db');

beforeEach(setupDB);

test('Should create task for user',async ()=>{
    const response = await
    request(app)
    .post('/tasks')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send({
        description: "Complete section 16",
    })
    .expect(201);

    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();

    //Check that the property is set to false by default
    expect(task.completed).toEqual(false);
});

test('Should get all tasks for the user', async()=>{
    const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

    //Checking if we are getting the exact same number of tasks
    expect(response.body).toHaveLength(2)
});

test('Should fail to delete task if not the owner', async()=>{
    await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization',`Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404) //User is authenticated, but since it's not entitled to see the task we return a 404

    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
})

test('Should not create task with invalid description', async()=>{
    await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({completed: false})
    .expect(400)
});

test('Should not update task with invalid description', async()=>{
    await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({description: ''})
    .expect(400)
});

test('Should delete user task', async()=>{
    const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    const task = await Task.findById(response.body._id);
    expect(task).toBeNull();
});

test('Should not delete task if unathenticated', async()=>{
    await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .send()
    .expect(401)

    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull()
});

test('Should not update other users tasks', async()=>{
    await request(app)
    .patch(`/tasks/${taskThree._id}`)
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send({description: 'Finishing test cases'})
    .expect(404)

    const task = await Task.findById(taskThree._id);
    expect(taskThree).toMatchObject({
        _id: task._id,
        description: task.description,
        author: task.author
    })
})

test('Should fetch user task by id', async()=>{
    await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
});

test('Should not fetch user task by id if unauthenticated',async()=>{
    await request(app)
    .get(`/tasks/${taskOne._id}`)
    .send()
    .expect(401)
});

test('Should not fetch other users task by id', async()=>{
    await request(app)
    .get(`/tasks/${taskThree._id}`)
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(404)
})

test('Should fetch only completed tasks',async()=>{
    const response = await request(app)
    .get('/tasks?completed=true')
    .set('Authorization',`Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200)

    const completed = await Task.find({completed: true, author: userTwo._id})
    expect(completed.length).toEqual(response.body.length);
})

test('Should only fetch incomplete tasks',async()=>{
    const response = await request(app)
    .get('/tasks?completed=false')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    const incompleted = await Task.find({completed: false, author: userOne._id})
    expect(incompleted.length).toEqual(response.body.length)
})