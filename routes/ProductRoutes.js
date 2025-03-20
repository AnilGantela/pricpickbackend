const express = require("express");
const router = express.Router();
const multer = require("multer");
const productController = require("../controllers/ProductController");

const upload = multer({ dest: "uploads/" });

router.post("/create", upload.array("images", 5), async (req, res) => {
  try {
    console.log("Received Files:", req.files); // Log uploaded images
    console.log("Request Body:", req.body); // Log form data

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded." });
    }

    res.status(200).json({ message: "Images uploaded successfully!" });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.put("/update/:id", productController.updateProduct);
router.delete("/delete/:id", productController.deleteProduct);
router.put("/apply-discount/:id", productController.applyDiscount);
router.get("/all", productController.getRetailerProducts);
router.get("/categories", productController.getProductCategoryData);
router.get("/addCategories", productController.getAddProductCategories);

module.exports = router;
