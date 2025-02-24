const cloudinary = require("../config/cloudinary.js");
const RetailerDetails = require("../models/RetailerDetails.js");
const Retailer = require("../models/Retailer.js");

// Create Retailer Details
const createRetailerDetails = async (req, res) => {
  try {
    const {
      shopname,
      phoneNumber,
      street,
      pincode,
      city,
      state,
      shoptime,
      photo,
    } = req.body;
    const retailerId = req.user.id;

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

    // Ensure the retailer does not already have a profile
    const existingRetailer = await RetailerDetails.findOne({ retailerId });
    if (existingRetailer) {
      return res
        .status(400)
        .json({ message: "Retailer details already exist" });
    }

    // Handle image upload with compression
    let imageUrl = "";
    if (image) {
      try {
        console.log("Received Image Data:", image.substring(0, 100)); // Debug log
        const uploadedImage = await cloudinary.uploader.upload(image, {
          folder: "retailers",
          transformation: [
            { width: 500, height: 500, crop: "fill" },
            { quality: "auto:low" },
            { fetch_format: "auto" },
            { flags: "progressive" },
            { dpr: "auto" },
          ],
        });
        imageUrl = uploadedImage.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadError.message });
      }
    }

    // Save retailer details
    const retailerDetails = new RetailerDetails({
      shopname,
      phoneNumber,
      address: {
        street,
        pincode,
        city,
        state,
      },
      shoptime,
      photo: imageUrl,
      retailerId,
    });

    await retailerDetails.save();
    await Retailer.updateOne({ _id: retailerId }, { detailsAdded: true });

    res.status(201).json({
      message: "Retailer details added successfully",
      retailerDetails,
    });
  } catch (error) {
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
