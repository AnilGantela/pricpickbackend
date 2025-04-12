const express = require("express");
const router = express.Router();
const webscrap = require("../controllers/webscrap");

router.get("/:searchName", webscrap.getProducts);
router.post("/retailer/:searchName", webscrap.getRetailersProducts);
router.post("/products", webscrap.getAllRetailersProducts);
router.get("/product/:id", webscrap.getProductById);
router.get("/retailer/:retailerId", webscrap.getAllProductsByRetailerId);
router.post("/order", webscrap.createOrder);

module.exports = router;
