const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const {OAuth2Client} = require('google-auth-library');
require("dotenv").config()
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

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

authController.loginWithGoogle = async (req, res) => {
    try{
        const { token } =req.body;
        const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const {email,name} = ticket.getPayload();
        let user = await User.findOne({email})
        if(!user){
            //유저를 새로 생성
            //구글 유저는 password가 필요하지 않음. 임의 생성
            const randomPassword = ''+Math.floor(Math.random()*1000000)
            const salt = await bcrypt.genSaltSync(10);
            const newPassword = await bcrypt.hashSync(randomPassword,salt);
            user = new User({
                name,
                email,
                password:newPassword,
            })
            await user.save();
        }
        //토큰발행 리턴
        const sessionToken = await user.generateToken()
        res.status(200).json({status:"success",user,token:sessionToken});

        // 토큰값을 읽어와서 => 유저정보를 뽑아내고 email
        // a. 이미 로그인을 한적이 있는 유저 => 로그인시키고 토큰값 주면 장땡
        // b. 처음 로그인 시도를 한 유저다 => 유저 정보 새로 생성 => 토큰값
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    }
}

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