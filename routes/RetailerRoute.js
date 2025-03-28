const express = require("express");
const retailerController = require("../controllers/RetailerController");
const retailerDetailsController = require("../controllers/RetailerDetailsController");
const authenticate = require("../middleware/authMiddleware");
const multer = require("multer");

const router = express.Router();

// ✅ Multer Setup (Memory Storage for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 Authentication & OTP Routes
router.post("/register", retailerController.retailerRegister);
router.post("/verify-otp", retailerController.verifyOTP);
router.post("/login", retailerController.retailerLogin);
router.post("/verify-login-otp", retailerController.verifyLoginOTP);
router.get("/checkDetails", retailerController.getRetailerDetailsAdded);

// ✅ Protected Routes (Require Authentication)
router.use(authenticate);
router.get("/", retailerController.getRetailer);

// ✅ Retailer Details Routes
router.post(
  "/add-details",
  upload.single("photo"),
  retailerDetailsController.createRetailerDetails
);
router.get("/details", retailerDetailsController.getRetailerDetails);

module.exports = router;
