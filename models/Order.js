const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    totalAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (value) => parseFloat(value.toString()).toFixed(2), // Convert to float with 2 decimals
      set: (value) =>
        mongoose.Types.Decimal128.fromString(Number(value).toFixed(2)), // Ensure to save it as Decimal128
    },
    status: {
      type: String,
      enum: ["created", "pending", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    deliveryAddress: {
      name: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
