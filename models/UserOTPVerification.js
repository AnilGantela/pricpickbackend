const mongoose = require("mongoose");

const userOTPVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model
    required: true,
    ref: "User",
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// Automatically remove expired OTPs using a TTL index
userOTPVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const userOTPVerification = mongoose.model(
  "UserOTPVerification",
  userOTPVerificationSchema
);

module.exports = userOTPVerification;
