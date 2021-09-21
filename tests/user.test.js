const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const {userOneId, userOne, setupDB} = require('./fixtures/db');
const bcrypt = require('bcryptjs')
//Fixtures allow to set the test environment in order to run it

//Mocking replacing real functions that run with test function we use when running on a test environment

//Jest lifecicle allows us to run code before or after a test case is run these are global functions
beforeEach(setupDB);

test('Should sign up a new user',async ()=>{
    const response = await request(app)
    .post('/users')
    .send({
        name: "Jesus Guzman",
        email: "jesusramone12@hotmail.com",
        password: "He1rqwsadeq"
    })
    .set('Accept', 'application/json')
    .expect(201);
    //Ideas for things to test

    //Assert that the DB changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull()

    //Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: "Jesus Guzman",
            email: "jesusramone12@hotmail.com",
        },
        token: user.tokens[0].token
    });

    //Assert pwd is not stored as plain text
    expect(user.password).not.toBe('He1rqwsadeq');
});

test('Should login existing user',async ()=>{
    const {email, password} = userOne;
    const response = await request(app)
    .post('/users/login')
    .set('Accept','application/json')
    .send({email, password})
    .expect(200)
    const user = await User.findById(response.body.user._id);

    //Assert token is the same as 2nd token on the DB
/*     expect(response.body).toMatchObject({
        token: user.tokens[1].token
    }) */
    //Alternative way
    expect(response.body.token).toBe(user.tokens[1].token) //To Be uses triple equality operator
});


test('Should not login nonexistent user', async()=>{
    await request(app)
    .post('/users/login')
    .set('Accept','application/json')
    .send({email:'nonexistent@email.com',password:'mypass1234!'})
    .expect(400)
});

test('Should get profile for user', async ()=>{
    await request(app)
    .get('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated users', async()=>{
    await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete account for user', async()=>{
    await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
    
    //Check if the user was propertly deleted from the database
    const user = await User.findById(userOneId);
    expect(user).toBeNull()
});

test('Should not delete account for unaothorized users', async ()=>{
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
});

test('Should upload avatar image', async()=>{
    await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar','tests/fixtures/e.jpg')
    .expect(200)

    //Assert that the ppicture was saved on the user profile
    const user = await User.findById(userOne._id)
    expect(user.avatar).toEqual(expect.any(Buffer)) //To equal checks the properties are the same, using any checks if the avatar image is a buffer
});

test('Should update valid user fields',async()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({name: 'Jesus Gman'})
    .expect(200)

    const user = await User.findById(userOneId);
    expect(user.name).toBe('Jesus Gman');
});

test('Should not update invalid user fields', async()=>{
    const response = await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({location: 'Guadalajara'})
    .expect(400);

    expect(response.body.Error).toBe('invalid operation!')
});


test('Should not signup users with invalid credentials', async()=>{
    await request(app)
    .post('/users/login')
    .send({email: userOne.email, password: '1234'})
    .expect(400)
});

test('Should not update user if unauthenticated', async()=>{
    await request(app)
    .patch('/users/me')
    .send({name: 'Jesus Guzman'})
    .expect(401)
})

test('Should not update user with invalid data', async()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({password: '1234'})
    .expect(400)

    const user = await User.findById(userOneId);
    const isMatch = await bcrypt.compare(userOne.password,user.password);
    expect(isMatch).toBe(true);
});

test('Should not delete user if unauthenticated',async()=>{
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
});

