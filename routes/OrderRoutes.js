const express = require("express");
const {
  createOrder,
  verifyRazorpayPayment,
  confirmCodOrder,
} = require("../controllers/OrderController");

const router = express.Router();

router.post("/create", createOrder);
router.post("/verify", verifyRazorpayPayment);
router.post("/cod/confirm", confirmCodOrder);

module.exports = router;
