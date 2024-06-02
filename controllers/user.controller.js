const User = require('../models/User');
const bcrypt = require('bcryptjs');

const userController = {};

userController.createUser = async(req,res) => {
    try{
        let {email,password,name,level} = req.body
        const user = await User.findOne({email})
        if(user){
            throw new Error('User already exist')
        }
        const salt = await bcrypt.genSaltSync(10)
        password = await bcrypt.hashSync(password,salt)
        const newUser = new User({email,password,name,level:level?level:'customer'})
        await newUser.save()
        return res.status(200).json({status:'success'})
    }catch(error){
        res.status(400).json({status:'fail',error:error.message});
    }
};

userController.getUser = async(req,res)=>{
    try{
        const {userId} = req;
        const user = await User.findById(userId);
        if(user){
            res.status(200).json({status:"success",user});
        }
        throw new Error("Invalid token");
    }catch(error){
        res.status(400).json({status:"error",error:error.message});
    }
};

module.exports = userController;