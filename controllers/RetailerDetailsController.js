const RetailerDetails = require("../models/RetailerDetails");
const Retailer = require("../models/Retailer");

// Create Retailer Details
const createRetailerDetails = async (req, res) => {
  try {
    const { shopname, phoneNumber, address, shoptime } = req.body;
    const retailerId = req.user.id; // Extracted from middleware

    if (!shopname || !phoneNumber || !address || !shoptime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Ensure the retailer does not already have a profile
    const existingRetailer = await RetailerDetails.findOne({ retailerId });
    if (existingRetailer) {
      return res
        .status(400)
        .json({ message: "Retailer details already exist" });
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

    res.status(201).json({
      message: "Retailer details added successfully",
      retailer,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Retailer Details
const getRetailerDetails = async (req, res) => {
  try {
    const retailerId = req.user.id;

    const retailerDetails = await RetailerDetails.findOne({ retailerId });

    if (!retailerDetails) {
      return res.status(404).json({ message: "Retailer details not found" });
    }

    res.status(200).json(retailerDetails);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Retailer Details
const updateDetails = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const { phoneNumber, shoptime } = req.body;
    const updateFields = {};

    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (shoptime) updateFields.shoptime = shoptime;

    const updatedRetailer = await RetailerDetails.findOneAndUpdate(
      { retailerId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedRetailer) {
      return res.status(404).json({ message: "Retailer details not found" });
    }

    res.status(200).json({
      message: "Retailer details updated successfully",
      updatedRetailer,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createRetailerDetails, getRetailerDetails, updateDetails };
