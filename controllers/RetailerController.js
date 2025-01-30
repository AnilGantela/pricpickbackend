const Retailer = require("../models/Retailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserOTPVerification = require("../models/UserOTPVerification");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

// Helper function to send OTP verification email
const sendUserOtpVerificationEmail = async ({ _id, email }) => {
  try {
    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1 style="color: #4CAF50;">Your OTP Code</h1>
          <p style="font-size: 18px;">Please use the following OTP to complete your verification process:</p>
          <div style="font-size: 36px; font-weight: bold; margin: 20px 0; color: #333;">${otp}</div>
          <p style="font-size: 14px; color: #666;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
        </div>
      `,
    };

    const hashedOTP = await bcrypt.hash(otp, 10);

    const newOTPVerification = new UserOTPVerification({
      userId: _id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000,
    });

    await newOTPVerification.save();
    await transporter.sendMail(mailOptions);

    return { success: true, message: "Verification OTP email sent." };
  } catch (error) {
    throw new Error("Failed to send OTP email.");
  }
};

// Retailer Registration Handler
const retailerRegister = async (req, res) => {
  try {
    const {
      username,
      shopname,
      email,
      phoneNumber,
      password,
      address,
      shoptime,
    } = req.body;

    if (
      !username ||
      !shopname ||
      !email ||
      !phoneNumber ||
      !password ||
      !address ||
      !shoptime
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingRetailer = await Retailer.findOne({
      $or: [{ email }, { shopname }],
    });
    if (existingRetailer) {
      return res
        .status(400)
        .json({ message: "Email or Shop Name already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newRetailer = new Retailer({
      username,
      shopname,
      email,
      phoneNumber,
      password: hashedPassword,
      address,
      shoptime,
    });
    await newRetailer.save();

    const token = jwt.sign(
      { id: newRetailer._id, email: newRetailer.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await sendUserOtpVerificationEmail({ _id: newRetailer._id, email });

    res.status(200).json({
      message: "Retailer registered successfully!.",
      token,
    });
  } catch (error) {
    console.error("Error registering retailer:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

// OTP Verification Handler (using JWT token)
const verifyOTP = async (req, res) => {
  try {
    const { token, otp } = req.body;

    // Validate input
    if (!token || !otp) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );
    const userId = decoded.id;

    // Fetch OTP records
    const otpRecords = await UserOTPVerification.find({ userId });
    if (otpRecords.length === 0) {
      return res.status(404).json({
        message:
          "No OTP records found or email already verified. Please try again.",
      });
    }

    const { expiresAt, otp: hashedOTP } = otpRecords[0];

    // Check if OTP has expired
    if (expiresAt < Date.now()) {
      await UserOTPVerification.deleteMany({ userId });
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    const validOtp = await bcrypt.compare(otp, hashedOTP);
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Mark retailer as verified
    await Retailer.updateOne({ _id: userId }, { verified: true });
    await UserOTPVerification.deleteMany({ userId });

    res.status(200).json({
      status: "VERIFIED",
      message: "User email verified successfully.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

const retailerLogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await Retailer.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Email not found. Please try again." });
    }

    // Send OTP to email
    await sendUserOtpVerificationEmail({ _id: user._id, email });

    res.status(200).json({
      status: "PENDING",
      message: "OTP sent to your email. Please verify.",
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

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

    // Fetch OTP records for this user
    const otpRecord = await UserOTPVerification.findOne({
      userId: user._id,
    });
    if (!otpRecord) {
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < Date.now()) {
      await UserOTPVerification.deleteMany({ userId: user._id });
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Validate OTP
    const validOtp = await bcrypt.compare(otp, otpRecord.otp);
    if (!validOtp) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    // OTP is valid, delete it from the database
    await UserOTPVerification.deleteMany({ userId: user._id });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      status: "SUCCESS",
      message: "Login successful!",
      token,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

module.exports = { retailerRegister, verifyOTP, retailerLogin, verifyLoginOTP };
