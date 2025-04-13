const express = require("express");
const {
  createOrder,
  verifyRazorpayPayment,
  getAllOrdersByClerkId,
} = require("../controllers/OrderController");

const router = express.Router();

router.post("/create", createOrder);
router.post("/verify", verifyRazorpayPayment);
router.get("/user/:userId", getAllOrdersByClerkId);

module.exports = router;
