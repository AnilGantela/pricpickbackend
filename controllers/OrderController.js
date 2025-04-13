const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const mongoose = require("mongoose");
const User = require("../models/User"); // ⬅️ Don't forget to import this!
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  const {
    userId: clerkUserId,
    products,
    totalAmount,
    method,
    deliveryAddress,
  } = req.body;

  try {
    // 🔍 Map Clerk ID to MongoDB User ID
    const user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Round totalAmount to 2 decimal places
    const roundedTotalAmount = parseFloat(totalAmount).toFixed(2);

    // Convert the totalAmount to Decimal128
    const decimalTotalAmount =
      mongoose.Types.Decimal128.fromString(roundedTotalAmount);

    let razorpayOrder = null;
    let payment = null;

    if (method === "razorpay") {
      razorpayOrder = await razorpay.orders.create({
        amount: decimalTotalAmount.toString() * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      payment = await Payment.create({
        method,
        amount: decimalTotalAmount, // Store as Decimal128
        status: "created",
        razorpayOrderId: razorpayOrder.id,
      });
    }

    const order = await Order.create({
      userId: user._id,
      products,
      totalAmount: mongoose.Types.Decimal128.fromString(totalAmount.toFixed(2)), // Convert to Decimal128
      status: method === "cod" ? "pending" : "created",
      paymentId: payment?._id,
      deliveryAddress,
    });

    if (payment) {
      payment.orderId = order._id;
      await payment.save();
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
      payment,
      razorpayOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Verify Razorpay Payment
exports.verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  try {
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ message: "Invalid signature", success: false });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    await Order.findByIdAndUpdate(payment.orderId, { status: "confirmed" });

    res.json({ message: "Payment verified", success: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
};
