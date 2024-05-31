const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const indexRouter = require('./routes/index')
const app = express()

require('dotenv').config();
app.use(cors());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()) //req.body가 객체로 인식이 된다

app.use('/api',indexRouter);
// api/user 이런 주소로 오면 indexRouter로 감. 즉, 무조건 접속하면 indexRouter로 간다.

const mongoURI = process.env.MONGODB_URI_ADDRESS;
// mongoose.connect(mongoURI,{useNewUrlParser:true})
mongoose.connect(mongoURI)
.then(()=>console.log("mongoose connected"))
.catch((err)=>console.log("DB connection fail", err));

app.listen(process.env.PORT || 5001,()=>{
    console.log("server on");
})