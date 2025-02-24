const express = require("express");
const retailerController = require("../controllers/RetailerController");
const retailerDetailsController = require("../controllers/RetailerDetailsController");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

// Authentication & OTP Routes
router.post("/register", retailerController.retailerRegister);
router.post("/verify-otp", retailerController.verifyOTP);
router.post("/login", retailerController.retailerLogin);
router.post("/verify-login-otp", retailerController.verifyLoginOTP);

// Protected Routes (Require Auth Middleware)
router.use(authenticate);
router.get("/", retailerController.getRetailer);
router.post("/add-details", retailerDetailsController.createRetailerDetails);
router.get("/details", retailerDetailsController.getRetailerDetails);

module.exports = router;
