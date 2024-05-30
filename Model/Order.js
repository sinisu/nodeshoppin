const mongoose = require("mongoose");
const Product = require("./Product");
const Schema = mongoose.Schema;
const orderSchema = Schema({
    userId:{
        type:mongoose.objectId,
        ref:User
    },
    shipTo:{
        type:Object,
        required:true
    },
    contact:{
        type:Object,
        required:true
    },
    orderNum:{
        type:String,
        required:true
    },
    items:[{
        productId:{
            type:mongoose.objectId,
            ref:Product
        },
        size:{
            type:String,
            required:true
        },
        qty:{
            type:Number,
            default:1,
            required:true
        },
        price:{
            type:Number,
            required:true
        }
    }],
    totalPrice:{
        type:Number,
        required:true,
        default:0
    },
    status:{
        type:String,
        default:"preparing"
    }
},{timestamps:true})

orderSchema.methods.toJson = function() {
    const obj = this._doc;
    delete obj.password;
    delete obj.__v;
    delete obj.updateAt;
    return obj
}

const Order = mongoose.model("Order",orderSchema)
module.exports = Order;