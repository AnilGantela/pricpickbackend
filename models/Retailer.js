const mongoose = require("mongoose");

const retailerSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  password: { type: String, required: true, trim: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

  retailerDetailsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RetailerDetails", // ✅ Reference RetailerDetails
  },

  createdDate: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
  detailsAdded: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("Retailer", retailerSchema);
