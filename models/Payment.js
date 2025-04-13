const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ["razorpay", "upi", "cod"] },
    amount: Number,
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
