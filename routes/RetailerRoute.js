const retailerContoller = require("../controllers/RetailerController");

const express = require("express");

const router = express.Router();

router.post("/register", retailerContoller.retailerRegister);

router.post("/verifyOTP", retailerContoller.verifyOTP);

router.post("/login", retailerContoller.retailerLogin);

router.post("/verifyloginotp", retailerContoller.verifyLoginOTP);

module.exports = router;
