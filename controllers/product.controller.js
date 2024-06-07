const Product = require("../models/Product");

const PAGE_SIZE = 5;
const productController = {}

productController.createProduct = async(req,res) =>{
    try{
        const {sku,name,size,image,category,description,price,stock,status} = req.body;
        const product = new Product({sku,name,size,image,category,description,price,stock,status});
        await product.save();
        res.status(200).json({status:"success",product});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    }
;}

productController.getProducts = async(req,res) => {
    try{
        const {page,name,pagesize} = req.query;
        let response = {status:"success"};
        const cond = name
            ?{name:{$regex:name,$options:'i'},isDeleted:false}
            :{isDeleted:false};
        let query = Product.find(cond);
        // 아래 방식은 조건이 늘어날 때 마다 구문을 새로 써야 하므로 비효율적
        // if(name){
        //     const product = await Product.find({name:{
        //         $regex:name, // name을 포함한 정보를 검색
        //         $option:"i" // 대문자, 소문자 구분하지 않겠다는 뜻
        //     }});
        // }else{
        //     const products = await Product.find({});
        // }

        if(page){
            // skip,limit은 mongoose의 함수
            // skip은 data값을 skip해 줌
            // limit은 최대 몇 개씩 보여줄 것인지 
            query.skip((page-1)*PAGE_SIZE).limit(PAGE_SIZE);
            // 전체 페이지
            // 데이터 총 개수
            const totalItemNum = await Product.find(cond).count();
            // 데이터 총 개수 / PAGE_SIZE
            const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
            response.totalItemNum = totalItemNum;
            response.pageSize = PAGE_SIZE;
            response.totalPageNum = totalPageNum;
        }

        const productList = await query.exec(); // query의 선언과 exec로 실행을 따로 함
        response.data = productList;
        res.status(200).json(response);
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    };
}

productController.getProductById = async(req,res) => {
    try{
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if(!product) throw new Error("Can not find Item");
        res.status(200).json({status:"success",data:product});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    }
}

productController.updateProduct = async(req,res) => {
    try{
        const productId = req.params.id;
        const {sku,name,size,image,category,description,price,stock,status} = req.body;
        const product = await Product.findByIdAndUpdate(
            {_id:productId},
            {sku,name,size,image,category,description,price,stock,status},
            {new:true}
        );
        if(!product) throw new Error("item doesn't exist");
        res.status(200).json({status:"success", data: product});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    }
}

productController.deleteProduct = async(req,res) => {
    try{
        const productId = req.params.id;
        const product = await Product.findByIdAndUpdate(
            {_id:productId},
            {isDeleted:true}
        );
        if(!product) throw new Error("item doesn't exist");
        res.status(200).json({status:"success", data: product});
    }catch(error){
        res.status(400).json({status:"fail",error:error.message});
    }
}

module.exports = productController;