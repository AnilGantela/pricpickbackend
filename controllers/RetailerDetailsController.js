const RetailerDetails = require("../models/RetailerDetails");
const Retailer = require("../models/Retailer");
const { verifyToken } = require("../middleware/authMiddleware.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createRetailerDetails = async (req, res) => {
  try {
    const { shopname, phoneNumber, address, shoptime } = req.body;
    const decoded = verifyToken(req);
    const retailerId = decoded.id;

    if (!shopname || !phoneNumber || !address || !shoptime) {
      return res.status(400).json({ message: "details missing" });
    }

    const existingRetailer = await RetailerDetails.findOne({ shopname });
    if (existingRetailer) {
      return res.status(400).json({ message: "Shopname already exists" });
    }

    const retailer = new RetailerDetails({
      shopname,
      phoneNumber,
      address,
      shoptime,
      retailerId,
    });
    await retailer.save();
    await Retailer.updateOne({ _id: retailerId }, { detailsAdded: true });

    res
      .status(201)
      .json({ message: "Retailer Details added successfully", retailer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all retailers
const getRetailerDetails = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const retailerId = decoded.id;
    const retailerDetails = await RetailerDetails.findOne({
      retailerId: retailerId,
    });
    res.status(200).json(retailerDetails);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Assuming you have middleware for token verification

const updateDetails = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const retailerId = decoded.id;

    const { phoneNumber, shoptime } = req.body;
    const updateFields = {};
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (shoptime) updateFields.shoptime = shoptime;

    const updatedRetailer = await RetailerDetails.findOneAndUpdate(
      { retailerId: retailerId }, // Find by retailer's ID from token
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedRetailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    res
      .status(200)
      .json({ message: "Retailer updated successfully", updatedRetailer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createRetailerDetails, getRetailerDetails, updateDetails };
