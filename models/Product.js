const mongoose = require("mongoose");
const { categoryValues } = require("../categories"); // Import categories

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true }, //  Added description
    price: { type: Number, required: true },
    images: [{ type: String, required: true }], //  Supports multiple images
    category: {
      type: String,
      required: true,
      enum: categoryValues, //  Main category validation
    },
    stock: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    retailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Retailer", //  Reference Retailer only
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
