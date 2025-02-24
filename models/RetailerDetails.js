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
    match: /^[0-9]{10}$/, // Ensures a valid 10-digit phone number
    trim: true,
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      match: /^[0-9]{6}$/, // Ensures a valid 6-digit pincode
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
  },
  shoptime: {
    type: String,
    required: true,
    trim: true,
  },
  photo: {
    type: String,
    default:
      "https://res.cloudinary.com/dzsgsaxyt/image/upload/v1672815063/cld-sample.jpg",
    required: false, // Not mandatory but useful for storing Cloudinary URLs
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
