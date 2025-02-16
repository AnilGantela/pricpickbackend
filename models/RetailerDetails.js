const mongoose = require("mongoose");

const retailerDetailsSchema = new mongoose.Schema({
  shopname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
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
  createdDate: {
    type: Date,
    default: Date.now,
  },
  retailerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Retailer",
    required: true,
  },
});

const RetailerDetails = mongoose.model(
  "RetailerDetails",
  retailerDetailsSchema
);

module.exports = RetailerDetails;
