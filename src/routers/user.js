const express = require('express');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationMail } = require('../emails/account');

const User = require('../models/user');

const router = new express.Router()

const upload = multer({
    //dest: './public/avatars',
    limits: {
        fileSize: 1000000 //In Bytes
    }, 
    fileFilter(req, file, cb) {
        if(file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(undefined,true);
        } else{
            cb(new Error('File must be an image'));
        }
    }
})

router.post('/users',async (req,res)=>{
    const user = new User(req.body);
    //If it fails code bellow won't run
    try{
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();

        res.status(201).send({user,token});
    } catch(e) {
        res.status(400).send(e.message);
    }

/*  With callbacks 
    user.save().then((data)=>{
        res.status(201).send(user);
    }).catch((error)=>{
        res.status(400).send(error);
    }); */
});

router.post('/users/login', async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user,token});
    }catch(err){
        res.status(400).send(err.message);
    }
});

router.post('/users/logout', auth, async (req,res)=>{
    try{
        //Removes all tokens except the one used in the authentication
        req.user.tokens = req.user.tokens.filter((token)=>token.token!== req.token);
        await req.user.save();
        res.send(); 
    } catch(e){
        res.status(500).send(e.message);
    }
});

router.post('/users/logoutAll',auth, async(req,res)=>{
    try{
        req.user.tokens = [];
        await req.user.save();
        res.send('Completely logged out!');
    }catch(e){
        res.status(500).send(e.message)
    }
});

router.get('/users/me',auth, async (req,res)=>{
     //Without anything in the object to retrieve all values
    res.send(req.user)
});

/* //Route parameters Not required anymore
router.get('/users/:id',async (req,res)=>{
    const _id = req.params.id;
    try {
        const user = await User.findById(_id);
        if(!user){
            return res.status(404).send('User not found');
        }
        res.status(201).send(user);
    } catch(e){
        res.status(500).send(e.message);
    }

    /*     User.findById(_id).then((user)=>{
        if(!user){
            return res.status(404).send('User not found');
        }
        res.send(user);
    }).catch((err)=>{ 
        res.status(500).send();
    }); 
}); */

//To update a value
router.patch('/users/me', auth, async (req,res)=>{
    //makes an array of strings with key as the value
    const incUpdates = Object.keys(req.body);
    const allowedAttr = ['name','email','password','age'];
    //if you get true for all values every returns true, returns false otherwise
    const isValidOpt = incUpdates.every((update)=> allowedAttr.includes(update));
    if(!isValidOpt){
        return  res.status(400).send({'Error': 'invalid operation!'});
    }

    try{
        //new option returns the new user
        //const updatedUsr = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        const updatedUsr = req.user;
        incUpdates.forEach((update)=>{
            updatedUsr[update]= req.body[update];
        });
        await updatedUsr.save();
        //For a 200 a status call is not required. 
        res.send(updatedUsr);
    }catch(e){
        //400 for when creation fails
        res.status(400).send(e.message);
    }
});

router.delete('/users/me', auth, async (req,res)=>{
    try{
        /* const deletedUsr = await User.findByIdAndDelete(req.user._id);
        if(!deletedUsr){
            return res.status(404).send('User was not found!');
        } */
        await req.user.remove() //To delete the authenticated user
        sendCancelationMail(req.user.email, req.user.name)
        res.send(req.user);
    }catch(e){
        res.status(500).send(e.message);
    }
});

//For middlewares always set the authentication as the first middleware
router.post('/users/me/avatar', auth, upload.single('avatar'),async (req,res)=>{
    //We can only access file if we don't have a destination for the data on the multer options.
    //req.user.avatar = req.file.buffer; //Binary data from the file.


    const buffer = await sharp(req.file.buffer)
    .resize({
        width: 350, height: 250
    })
    .png()
    .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send('Thanks for the upload m8')
}, (err, req, res, next)=>{ //This is a callback for the errors that were not handled in the request.
    res.status(400).send({error: err.message});
});

router.delete('/users/me/avatar', auth, async (req,res)=>{
    try{
        if(req.user.avatar){
            req.user.avatar = undefined;
            await req.user.save();
            return res.send('Image removed correctly!');
        } else {
            res.status(404).send('Your profile doesn\'t have a profile picture');
        }
    }catch(e){
        res.status(500).send(e.message);
    }
});

router.get('/users/:id/avatar', async (req,res)=>{
    try{
        const user = await User.findById(req.params.id);
        if(user && user.avatar){
            res.set('Content-Type', 'image/png');
            res.send(user.avatar);
        } else {
            throw new Error('There was a problem with your request!');
        }
    }catch(e){
        res.status(404).send(e.message);
    }
});

module.exports = router;