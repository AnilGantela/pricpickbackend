const mongoose = require("mongoose");

const retailerDetailsSchema = new mongoose.Schema({
  shopname: { type: String, required: true, unique: true, trim: true },
  phoneNumber: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/, // Ensures a valid 10-digit phone number
    trim: true,
  },
  address: {
    street: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: /^[0-9]{6}$/, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
  },
  shoptime: { type: String, required: true, trim: true },
  photo: {
    type: String,
    default:
      "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg",
    trim: true,
  },
  createdDate: { type: Date, default: Date.now },
  retailerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Retailer", // ✅ Reference Retailer
    required: true,
  },
});

module.exports = mongoose.model("RetailerDetails", retailerDetailsSchema);
