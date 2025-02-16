const Retailer = require("../models/Retailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserOTPVerification = require("../models/UserOTPVerification");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
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

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

const sendUserOtpVerificationEmail = async ({ _id, email }) => {
  try {
    const existingOTP = await UserOTPVerification.findOne({ userId: _id });

    // Prevent resending OTP within 60 seconds
    if (existingOTP && Date.now() - existingOTP.createdAt < 60000) {
      throw new Error("Please wait 60 seconds before requesting another OTP.");
    }

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: `
        <div style="text-align: center; font-family: Arial, sans-serif;">
          <h1 style="color: #4CAF50;">Your OTP Code</h1>
          <p style="font-size: 18px;">Use this OTP to verify your email:</p>
          <div style="font-size: 36px; font-weight: bold; color: #333;">${otp}</div>
          <p style="font-size: 14px; color: #666;">OTP expires in 5 minutes.</p>
        </div>
      `,
    };

    const hashedOTP = await bcrypt.hash(otp, 10);

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

    return { success: true, message: "Verification OTP email sent." };
  } catch (error) {
    throw new Error(error.message || "Failed to send OTP email.");
  }
};

const retailerRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingRetailer = await Retailer.findOne({
      $or: [{ email }],
    });
    if (existingRetailer) {
      return res.status(400).json({ message: "Email  already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newRetailer = new Retailer({
      username,
      email,
      password: hashedPassword,
    });
    await newRetailer.save();

    const token = jwt.sign(
      { id: newRetailer._id, email: newRetailer.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await sendUserOtpVerificationEmail({ _id: newRetailer._id, email });

    res.status(200).json({
      message: "Email verification is send. please enter the otp.",
    });
  } catch (error) {
    console.error("Error registering retailer:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

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

    if (!otpRecord) {
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });
    }

    if (otpRecord.expiresAt < Date.now()) {
      await UserOTPVerification.deleteMany({ userId: user._id });
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    const validOtp = await bcrypt.compare(otp, otpRecord.otp);
    if (!validOtp) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    await Retailer.updateOne({ _id: user._id }, { verified: true });

    await UserOTPVerification.deleteMany({ userId: user._id });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
      .status(200)
      .json({ status: "SUCCESS", message: "Registeration successful!", token });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
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

const getRetailer = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const retailerId = decoded.id;

    const retailerDetails = await Retailer.findOne(
      { _id: retailerId },
      "username email detailsAdded" // Select only the required fields
    );

    if (!retailerDetails) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    res.status(200).json(retailerDetails);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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

    const otpRecord = await UserOTPVerification.findOne({ userId: user._id });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });
    }

    if (otpRecord.expiresAt < Date.now()) {
      await UserOTPVerification.deleteMany({ userId: user._id });
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    const validOtp = await bcrypt.compare(otp, otpRecord.otp);
    if (!validOtp) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    // Delete OTP record after successful verification
    await UserOTPVerification.deleteMany({ userId: user._id });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
      .status(200)
      .json({ status: "SUCCESS", message: "Login successful!", token });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

module.exports = {
  retailerRegister,
  verifyOTP,
  retailerLogin,
  verifyLoginOTP,
  getRetailer,
};
