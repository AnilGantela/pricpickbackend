const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    method: {
      type: String,
      enum: ["upi", "razorpay", "cod"],
    },
    status: {
      type: String,
      enum: ["created", "paid", "pending", "failed"],
    },
    amount: Number,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    upiTxnId: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
