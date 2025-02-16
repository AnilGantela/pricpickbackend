const retailerContoller = require("../controllers/RetailerController");
const retailerDetailsController = require("../controllers/RetailerDetailsController");

const express = require("express");

const router = express.Router();

router.post("/register", retailerContoller.retailerRegister);
router.post("/addDetails", retailerDetailsController.createRetailerDetails);
router.get("/Details", retailerDetailsController.getRetailerDetails);
router.get("/", retailerContoller.getRetailer);

router.post("/verifyOTP", retailerContoller.verifyOTP);

router.post("/login", retailerContoller.retailerLogin);

router.post("/verifyloginotp", retailerContoller.verifyLoginOTP);

module.exports = router;
