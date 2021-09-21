const mongoose = require('mongoose');

const dbConn = process.env.TEST_CASES ? process.env.TEST_DB : process.env.MONGODB_CONN;

mongoose.connect(dbConn, {
    useNewUrlParser:true,
    useUnifiedTopology: true,
    useCreateIndex: true,  //To access data from models with index
    useFindAndModify: false
});

