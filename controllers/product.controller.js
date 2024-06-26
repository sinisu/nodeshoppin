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
        const {page,name,pagesize,category} = req.query;
        let response = {status:"success"};
        const cond = {
            isDeleted: false,
            ...(name && { name: { $regex: name, $options: 'i' } }),
            ...(category && { category:category })
          };
            // name
            // ?{name:{$regex:name,$options:'i'},isDeleted:false}
            // :{isDeleted:false}||
            // category?{category:category,isDeleted:false}:{isDeleted:false}
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

// productController.checkStock = async(item) => {
//     //내가 사려는 아이템 재고 정보 가져오기
//     const product = await Product.findById(item.productId);
//     //내가 사려는 아이템 qty, 재고 비교
//     if(product.stock[item.size] < item.qty) {
//         //재고가 불충분하면 불충분 메세지와 함께 데이터 반환
//         return {isVerify:false,message:`${product.name} ${item.size}사이즈의 재고가 부족합니다.`}
//     }
//     const newStock = {...product.stock}
//     newStock[item.size] -= item.qty
//     product.stock=newStock
//     await product.save();
//     //충분하다면 재고에서 -qty -> 성공 결과 보내기
//     return {isVerify:true}
// }

productController.checkItemListStock = async(itemList) => {
    try{
        const products = await Product.find({
            // $in은 MongoDB의 비교 연산자, 일치하는 값 찾아줌
            _id:{$in: itemList.map((item)=>item.productId)},
        });

        const productMap = products.reduce((map,product)=>{
            map[product._id] = product;
            return map;
        },{});

        const insufficientStockItems = itemList
        .filter((item)=>{
            const product = productMap[item.productId];
            return product.stock[item.size] < item.qty;
        })
        .map((item)=>{
            return {
                item,
                message:`${productMap[item.productId].name}의 ${item.size} 재고가 부족합니다.`,
            };
        });
        return insufficientStockItems;
    }catch(error){
        throw new Error("재고 확인 중 오류가 발생했습니다.")
    }
};

productController.reduceItemStock = async (itemList) => {
    try{
        await Promise.all(
            itemList.map(async(item)=>{
                const product = await Product.findById(item.productId);
                if(!product) {
                    throw new Error(`ID에 해당하는 제품을 찾을 수 없습니다: ${item.productId}`);
                }
                if (!product.stock[item.size]) {
                    throw new Error(`${product.name} 제품에 해당하는 사이즈 ${item.size}가 존재하지 않습니다.`);
                  }
                if (product.stock[item.size] === undefined) {
                    throw new Error(`${product.name} 제품에 해당하는 사이즈 ${item.size}가 정의되지 않았습니다.`);
                }

                const newStock = {...product.stock};
                newStock[item.size] -= item.qty;
                product.stock = newStock
                
                await product.save()

                if(product.stock != newStock) {
                    throw new Error (`제품의 재고가 줄지 않았습니다!${product.stock},${newStock}`)
                }

                return product
            })
        );
    }catch(error){
        throw new Error(error.message);
    };
}

module.exports = productController;