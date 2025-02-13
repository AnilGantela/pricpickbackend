const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");

router.post("/create", productController.createProduct);
router.get("/all", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.put("/update/:id", productController.updateProduct);
router.delete("/delete/:id", productController.deleteProduct);
router.get("/featured", productController.getFeaturedProducts);
router.put("/apply-discount/:id", productController.applyDiscount);
router.get("/products", getRetailerProducts);

module.exports = router;
