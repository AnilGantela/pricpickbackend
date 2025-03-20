const { uploadImage } = require("../utils/uploadImage");
const RetailerDetails = require("../models/RetailerDetails.js");
const Retailer = require("../models/Retailer.js");

const createRetailerDetails = async (req, res) => {
  try {
    const { shopname, phoneNumber, street, pincode, city, state, shoptime } =
      req.body;
    const retailerId = req.user.id;

    // ✅ Validate required fields
    if (
      !shopname ||
      !phoneNumber ||
      !street ||
      !pincode ||
      !city ||
      !state ||
      !shoptime
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check if retailer details already exist
    const existingRetailer = await RetailerDetails.findOne({ retailerId });
    if (existingRetailer) {
      return res
        .status(400)
        .json({ message: "Retailer details already exist" });
    }

    // ✅ Check if phone number is already used
    const existingPhone = await RetailerDetails.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // ✅ Handle image upload (supporting both file & base64)
    let imageUrl = "";
    if (req.files && req.files.photo) {
      imageUrl = await uploadImage(req.files.photo.path, "pricepick/retailers");
    } else if (req.body.photo) {
      imageUrl = await uploadImage(req.body.photo, "pricepick/retailers");
    }

    // ✅ Save retailer details
    const retailerDetails = new RetailerDetails({
      shopname,
      phoneNumber,
      address: { street, pincode, city, state },
      shoptime,
      photo: imageUrl,
      retailerId,
    });

    await retailerDetails.save();

    // ✅ Update the Retailer document with retailerDetailsId
    await Retailer.findByIdAndUpdate(retailerId, {
      detailsAdded: true,
      retailerDetailsId: retailerDetails._id,
    });

    res.status(201).json({
      message: "Retailer details added successfully",
      retailerDetails,
    });
  } catch (error) {
    console.error("Error adding retailer details:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Retailer Details
const getRetailerDetails = async (req, res) => {
  try {
    const retailerId = req.user.id;

    const retailerDetails = await RetailerDetails.findOne({
      retailerId,
    }).lean();
    if (!retailerDetails) {
      return res.status(404).json({ message: "Retailer details not found" });
    }

    const retailer = await Retailer.findById(retailerId)
      .select("username email")
      .lean();
    if (!retailer) {
      return res.status(404).json({ message: "Retailer account not found" });
    }

    res.status(200).json({ ...retailer, ...retailerDetails });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createRetailerDetails, getRetailerDetails };
