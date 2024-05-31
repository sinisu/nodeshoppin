const mongoose = require("mongoose");
const Product = require("./Product");
const Schema = mongoose.Schema;
const cartSchema = Schema({
    userId:{
        type:mongoose.objectId,
        ref:User
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
        }
    }]
},{timestamps:true})

cartSchema.methods.toJson = function() {
    const obj = this._doc;
    delete obj.password;
    delete obj.__v;
    delete obj.updateAt;
    delete obj.createAt;
    return obj
}

const Cart = mongoose.model("Cart",cartSchema)
module.exports = Cart;
