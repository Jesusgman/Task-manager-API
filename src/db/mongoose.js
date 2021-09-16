const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_CONN, {
    useNewUrlParser:true,
    useUnifiedTopology: true,
    useCreateIndex: true,  //To access data from models with index
    useFindAndModify: false
});

