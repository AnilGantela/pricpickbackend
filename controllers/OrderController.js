const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order & Payment
exports.createOrder = async (req, res) => {
  const {
    userId,
    retailerId,
    products, // [{ productId, name, quantity, price }]
    totalAmount,
    method,
  } = req.body;

  try {
    let razorpayOrder = null;
    let payment = null;

    if (method === "razorpay") {
      razorpayOrder = await razorpay.orders.create({
        amount: totalAmount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      payment = await Payment.create({
        method,
        amount: totalAmount,
        status: "created",
        razorpayOrderId: razorpayOrder.id,
      });
    } else if (method === "upi") {
      payment = await Payment.create({
        method,
        amount: totalAmount,
        status: "pending",
      });
    } else if (method === "cod") {
      payment = await Payment.create({
        method,
        amount: totalAmount,
        status: "pending", // ✅ COD is marked as pending
      });
    }

    const order = await Order.create({
      userId,
      retailerId,
      products,
      totalAmount,
      status: method === "cod" ? "pending" : "created",
      paymentId: payment._id,
    });

    payment.orderId = order._id;
    await payment.save();

    res.status(201).json({
      message: "Order created",
      order,
      payment,
      razorpayOrder,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Order creation failed", error: error.message });
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

// Confirm COD order
exports.confirmCodOrder = async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const payment = await Payment.findById(order.paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "paid";
    await payment.save();

    order.status = "confirmed";
    await order.save();

    res.json({ message: "COD order confirmed", order });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to confirm COD order", error: err.message });
  }
};
