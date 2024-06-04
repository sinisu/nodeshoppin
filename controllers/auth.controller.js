const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require("dotenv").config()
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

const authController = {}

authController.loginWithEmail = async (req,res) => {
    try{
        const {email,password} = req.body;
        let user = await User.findOne({email});
        console.log(user)
        if(user){
            const isMatch = await bcrypt.compare(password,user.password)
            if(isMatch){
                const token = await user.generateToken();
                return res.status(200).json({status:"success",user,token});
            }
        }
        throw new Error("invalid email or error");
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    }
};

authController.authenticate = async (req,res,next) => {
    try{
        const tokenString = req.headers.authorization;
        if(!tokenString) throw new Error("Token not found");
        const token = tokenString.replace("Bearer ","");
        jwt.verify(token,JWT_SECRET_KEY,(error,payload)=>{
            if(error) throw new Error("invalid token");
            req.userId = payload._id;
        });
        next();
    }catch(error){
        res.status(400).json({status:"fail",error:error.message})
    }
};

authController.checkAdminPermission = async(req,res,next) => {
    try{
        //admin확인은 token 값에서 할 수 있음
        //authController.authenticate에서 이미 토큰 확인 가능 -> 미들웨어로 사용
        const {userId} = req;
        const user = await User.findById(userId);
        if(user.level !== "admin") throw new Error("no permission");
        next();
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    }
};

module.exports = authController;