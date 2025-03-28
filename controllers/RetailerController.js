const Retailer = require("../models/Retailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const UserOTPVerification = require("../models/UserOTPVerification");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const verifyToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new Error("Unauthorized. No token provided.");
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
  } catch (err) {
    throw new Error("Invalid or expired token.");
  }
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

// Send OTP Verification Email
const sendUserOtpVerificationEmail = async ({ _id, email }) => {
  try {
    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedOTP = await bcrypt.hash(otp, 10);

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: `<h1>Your OTP: ${otp}</h1><p>It expires in 5 minutes.</p>`,
    };

    await UserOTPVerification.updateOne(
      { userId: _id },
      {
        userId: _id,
        otp: hashedOTP,
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000,
      },
      { upsert: true }
    );

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Failed to send OTP email.");
  }
};

// Retailer Registration
const retailerRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingRetailer = await Retailer.findOne({ email });
    if (existingRetailer) {
      return res.status(400).json({ message: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newRetailer = new Retailer({
      username,
      email,
      password: hashedPassword,
    });
    await newRetailer.save();

    await sendUserOtpVerificationEmail({ _id: newRetailer._id, email });

    res.status(200).json({ message: "OTP sent to email for verification." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await Retailer.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const otpRecord = await UserOTPVerification.findOne({ userId: user._id });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired or not found." });
    }

    const validOtp = await bcrypt.compare(otp, otpRecord.otp);
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    await Retailer.updateOne({ _id: user._id }, { verified: true });
    await UserOTPVerification.deleteMany({ userId: user._id });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Verification successful!", token });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

// Retailer Login
const retailerLogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await Retailer.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found." });
    }

    await sendUserOtpVerificationEmail({ _id: user._id, email });

    res.status(200).json({ message: "OTP sent to email. Please verify." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

// Verify Login OTP
const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await Retailer.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const otpRecord = await UserOTPVerification.findOne({ userId: user._id });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired or not found." });
    }

    const validOtp = await bcrypt.compare(otp, otpRecord.otp);
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    await UserOTPVerification.deleteMany({ userId: user._id });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful!", token });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

// Get Retailer Profile (Protected Route)
const getRetailer = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const retailerDetails = await Retailer.findOne(
      { _id: retailerId },
      "username email detailsAdded"
    );

    if (!retailerDetails) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    res.status(200).json(retailerDetails);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

const getRetailerDetailsAdded = async (req, res) => {
  try {
    const decoded = verifyToken(req); // returns { id: ..., iat: ..., etc }
    const retailerId = decoded?.id;

    if (!retailerId || !mongoose.Types.ObjectId.isValid(retailerId)) {
      return res.status(400).json({ message: "Invalid retailer ID." });
    }

    const retailer = await Retailer.findById(retailerId);

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found." });
    }

    return res
      .status(200)
      .json({ detailsExist: retailer.detailsAdded ?? false });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  retailerRegister,
  verifyOTP,
  retailerLogin,
  verifyLoginOTP,
  getRetailer,
  getRetailerDetailsAdded,
};
