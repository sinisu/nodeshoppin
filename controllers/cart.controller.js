const { populate } = require("dotenv");
const Cart = require("../models/Cart");
const { model } = require("mongoose");
const cartController={}

cartController.addItemToCart = async(req,res) => {
    try{
        const {userId} = req; //미들웨어 auth.controller;
        const {productId,size,qty} = req.body;
        //유저를 가지고 카트 찾기
        let cart = await Cart.findOne({userId});
        //유저가 만든 카트가 없다, 만들어주기
        if(!cart){
            cart = new Cart({userId});
            await cart.save();
        };
        //이미 카트에 들어가있는 아이템인가?
        const existItem = cart.items.find(
            // mongoose.ObjectId 는 string이 아니므로 equals를 써야함
            (item)=>item.productId.equals(productId) && item.size === size
        );
        if(existItem){
            //그렇다면 에러 ('이미 카트에 존재하는 상품입니다.')
            throw new Error("이미 카트에 존재하는 상품입니다.");
        }
        //카트에 아이템을 추가
        cart.items = [...cart.items,{productId,size,qty}];
            await cart.save();
        res.status(200).json({status:"success",data:cart,cartItemQty:cart.items.length});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    };
};

cartController.getCartById = async(req,res)=>{
    try{
        const {userId} = req;
        // populate 외래키를 사용하여 다른 정보를 가져옴
        // path:'items' -> cartSchema의 items에 있는 정보를 사용
        // productId 기준으로 model은 Product를 가져옴
        const cart = await Cart.findOne({userId}).populate({
            path:'items',
            populate:{
                path:"productId",
                model:"Product",
            },
        });
        // if(!cart) throw new Error("카트가 비어있습니다!");
        res.status(200).json({status:"success",data:cart.items});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    };
};

cartController.deleteCartItem = async(req,res)=>{
    try{
        const {id} = req.params;
        const {userId} = req;
        const cart = await Cart.findOne({userId});
        cart.items = cart.items.filter((item)=> !item._id.equals(id));
        await cart.save();
        res.status(200).json({status:"success",cartItemQty:cart.items.length});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    };
};

cartController.updateCartItem = async(req,res)=>{
    try{
        const {id} = req.params;
        const {userId} = req;
        const {qty} = req.body;
        const cart = await Cart.findOne({userId}).populate({
            path:"items",
            populate:{
                path:"productId",
                model:"Product",
            },
        });
        if(!cart) throw new Error("Cart dose not exist!");
        const index = cart.items.findIndex((item)=>item._id.equals(id));
        //if(!index)라고 쓰지 않는 이유는 0도 false로 인식하기 때문임
        if(index === -1) throw new Error("Can not find item");
        cart.items[index].qty = qty;
        await cart.save();
        res.status(200).json({status:"success",data:cart.items});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    };
};

cartController.getCartQty = async(req,res)=>{
    try{
        const {userId} = req;
        const cart = await Cart.findOne({userId});
        if(!cart) throw new Error("Cart dose not exist!");
        res.status(200).json({status:"success",data:cart.items.length});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    };
};

module.exports = cartController;