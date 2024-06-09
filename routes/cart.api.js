const express = require('express');
const authController = require('../controllers/auth.controller');
const cartController = require('../controllers/cart.controller');
const router = express.Router()

router.post("/",authController.authenticate, cartController.addItemToCart);
router.get("/",authController.authenticate,cartController.getCartById);
router.delete("/:id",authController.authenticate,cartController.deleteCartItem);
router.put("/:id",authController.authenticate,cartController.updateCartItem);
router.get("/qty",authController.authenticate,cartController.getCartQty);

module.exports = router;