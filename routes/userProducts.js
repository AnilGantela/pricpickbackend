const express = require("express");
const router = express.Router();
const webscrap = require("../controllers/webscrap");

router.get("/:searchName", webscrap.getProducts);
router.POST("/retailer/:searchName", webscrap.getRetailersProducts);

module.exports = router;
