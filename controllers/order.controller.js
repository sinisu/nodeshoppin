const orderController ={};
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
            const errorMessage = insufficientStockItems.reduce(
                (total,item) => (total += item.message),""
            );
            throw new Error(errorMessage)
        }
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
        res.status(200).json({status:"success",orderNum:newOrder.orderNum});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    };
}

module.exports = orderController;