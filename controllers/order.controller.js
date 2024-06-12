const orderController ={};
const { populate } = require('dotenv');
const Order = require('../models/Order');
const {randomStringGenerator} = require('../utils/randomStringGenerator');
const productController = require('./product.controller');

orderController.createOrder = async(req,res)=>{
    try{
        //프론트엔드에서 데이터 보낸거 받아오기 userId,totalPrice,shipTo,contact,orderList
        const {userId} = req;
        const {totalPrice,shipTo,contact,orderList} = req.body;
        //재고확인, 재고업데이트
        const insufficientStockItems = await productController.checkItemListStock(orderList);
        //재고가 충분하지 않은 아이템이 존재한다 -> 에러
        if(insufficientStockItems.length>0){
            const errorMessage = insufficientStockItems
                .map((item)=>item.message)
                .join(" ");
            throw new Error(errorMessage);
        }

        await productController.reduceItemStock(orderList);
        //order생성
        const newOrder = new Order({
            userId,
            totalPrice,
            shipTo,
            contact,
            items:orderList,
            orderNum:randomStringGenerator(),
        });
        await newOrder.save();
        //save 한 후에 카트를 비워주자
        res.status(200).json({status:"success",orderNum:newOrder.orderNum});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    };
}

orderController.getOrder = async (req, res, next) => {
    const PAGE_SIZE = 10
    try{
        const {userId} = req;
        const orderList = await Order.find({userId: userId}).populate({
            path:"items",
            populate:{
                path:"productId",
                model:"Product",
                select:"image name",
            },
        });
        const totalItemNum = await Order.find({userId: userId}).count();
        const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
        res.status(200).json({ status: "success", data: orderList, totalPageNum });
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    }
}

orderController.getOrderList = async (req,res,next)=>{
    const PAGE_SIZE = 10
    try{
        const {page,ordernum} = req.query;
        let cond = {};
        if(ordernum) {
            cond = {
                orderNum: {$regex:ordernum, $option:"i"},
            };
        }
        const orderList = await Order.find(cond)
            .populate("userId")
            .populate({
                path:"items",
                populate:{
                    path:"productId",
                    model:"Product",
                    select:"image name",
                }
            })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);
        const totalItemNum = await Order.find(cond).count();
        const totalPageNum = Math.ceil(totalItemNum/PAGE_SIZE);
        res.status(200).json({status:"success",data:orderList,totalPageNum});
    }catch(error){
        res.status(400).json({ status: "fail", error: error.message });
    }
}

orderController.updateOrder = async (req, res, next) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      const order = await Order.findByIdAndUpdate(
        { _id:orderId },
        { status: status },
        { new: true }
      );
      if (!order) throw new Error("Can't find order");
  
      res.status(200).json({ status: "success", data: order });
    } catch (error) {
      return res.status(400).json({ status: "fail", error: error.message });
    }
  };

module.exports = orderController;