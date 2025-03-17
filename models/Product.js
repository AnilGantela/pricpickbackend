const mongoose = require("mongoose");
const { categoryValues, subcategoryValues } = require("../categories"); // Import categories

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: categoryValues, // ✅ Main category validation
    },
    stock: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    retailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Retailer", // ✅ Reference Retailer only
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
