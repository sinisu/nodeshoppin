const express = require('express');
const productController = require('../controllers/product.controller');
const authController = require('../controllers/auth.controller');
const router = express.Router();

//상품을 아무나 등록하지 못하게 하기 위해 권한 확인
router.post('/',
//퍼미션 체크 확인 전에 유저 아이디를 확인하면 됨
    authController.authenticate,
    authController.checkAdminPermission,
    productController.createProduct
);

router.get('/',productController.getProducts);
router.get('/:id',productController.getProductById); // get라우터를 2개 만들어도 된다!

router.put('/:id',
    authController.authenticate,
    authController.checkAdminPermission,
    productController.updateProduct
);

router.delete('/:id',
    authController.authenticate,
    authController.checkAdminPermission,
    productController.deleteProduct
)

module.exports = router;