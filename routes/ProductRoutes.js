const express = require("express");
const router = express.Router();
const multer = require("multer");
const productController = require("../controllers/ProductController");

const upload = multer({ dest: "uploads/" });

router.post(
  "/create",
  upload.array("images", 5),
  productController.createProduct
);
router.put("/update/:id", productController.updateProduct);
router.delete("/delete/:id", productController.deleteProduct);
router.put("/apply-discount/:id", productController.applyDiscount);
router.get("/all", productController.getRetailerProducts);
router.get("/categories", productController.getProductCategoryData);
router.get("/addCategories", productController.getAddProductCategories);

module.exports = router;
