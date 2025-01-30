const mongoose = require("mongoose");

const retailerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  shopname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  shoptime: {
    type: String,
    required: true,
    trim: true,
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  createdDate: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

const Retailer = mongoose.model("Retailer", retailerSchema);

module.exports = Retailer;
