const RetailerDetails = require("../models/RetailerDetails");
const Retailer = require("../models/Retailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

// Get a single retailer by ID
exports.getRetailerById = async (req, res) => {
  try {
    const retailer = await RetailerDetails.findById(req.params.id);
    if (!retailer)
      return res.status(404).json({ message: "Retailer not found" });

    res.status(200).json(retailer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update retailer details
exports.updateRetailer = async (req, res) => {
  try {
    const { shopname, phoneNumber, address, shoptime } = req.body;

    const updatedRetailer = await RetailerDetails.findByIdAndUpdate(
      req.params.id,
      { shopname, phoneNumber, address, shoptime },
      { new: true, runValidators: true }
    );

    if (!updatedRetailer)
      return res.status(404).json({ message: "Retailer not found" });

    res
      .status(200)
      .json({ message: "Retailer updated successfully", updatedRetailer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a retailer
exports.deleteRetailer = async (req, res) => {
  try {
    const deletedRetailer = await RetailerDetails.findByIdAndDelete(
      req.params.id
    );
    if (!deletedRetailer)
      return res.status(404).json({ message: "Retailer not found" });

    res.status(200).json({ message: "Retailer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createRetailerDetails, getRetailerDetails };
