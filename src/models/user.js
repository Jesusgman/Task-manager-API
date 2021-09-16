const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Task = require('./task')
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({ 
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: { 
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid!');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 6, //could also be done with an if
        validate(value){
           if(value.toLowerCase().includes('password')){
               throw new Error('The password can\'t contain the word password')
           }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('Age can\'t be a negative number!');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer //This is not efficient, rather connect to a dedicated DB for images
    }
},{
    timestamps: true
});

//Virtual property = relationship between to entities, not stored on the DB
userSchema.virtual('tasks',{
    ref: 'Task',
    localField: '_id', //Local field where the foreign date was collected from
    foreignField: 'author' //Foreign field name on the other entity
})

//Middleware pre before validation, post after validation
//Using function since it needs to bind "this" which can't be done on an arrow function
userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        //To store passwords hashed
        this.password = await bcrypt.hash(this.password,8);
    }
    
    next(); // Using next when we are done to terminate the function.
});

//Delete user tasks when user is removed
userSchema.pre('remove',async function(next){
    await Task.deleteMany({author: this._id});
    next();
})

//Instance methods
userSchema.methods.generateAuthToken = async function(){
    const token = jwt.sign({'_id': this._id.toString()},process.env.JWT_SECRET,{expiresIn: '2 days'});

    this.tokens = this.tokens.concat({token});

    await this.save();
    return token
}

userSchema.methods.toJSON = function(){
    const userObject = this.toObject() ;
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar; //We delete it since we are making a route for it.
    return userObject// or see return bellow
/*     return {
        name: this.name,
        email: this.email,
        age: this.age,
        _id: this.id
    }; */
}

//model methods
userSchema.statics.findByCredentials = async(email,password)=> {
    const user = await User.findOne({email});
    if(!user){
        throw new Error('User doesn\'t exists!');
    }

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        throw new Error('Password is incorrect!');
    }
    return user;
}

const User = mongoose.model('User',userSchema);

module.exports = User;