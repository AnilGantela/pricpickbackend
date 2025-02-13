const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");

// Debugging: Log the controller to see what's actually imported
console.log("Product Controller:", productController);

router.post("/create", productController.createProduct);
router.put("/update/:id", productController.updateProduct);
router.delete("/delete/:id", productController.deleteProduct);
router.get("/featured", productController.getFeaturedProducts);
router.put("/apply-discount/:id", productController.applyDiscount);
router.get("/all", productController.getRetailerProducts);
router.get("/categories", productController.getProductCategoryData);

module.exports = router;
