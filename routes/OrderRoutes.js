const express = require("express");
const {
  createOrder,
  verifyRazorpayPayment,
} = require("../controllers/OrderController");

const router = express.Router();

router.post("/create", createOrder);
router.post("/verify", verifyRazorpayPayment);

module.exports = router;
