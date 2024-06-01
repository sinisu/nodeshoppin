const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

module.exports = authController;