const cloudinary = require("cloudinary").v2;
import RetailerDetails from "../models/RetailerDetails.js";
import Retailer from "../models/Retailer.js";

const createRetailerDetails = async (req, res) => {
  try {
    const { shopname, phoneNumber, address, shoptime, image } = req.body;
    const retailerId = req.user.id;

    if (!shopname || !phoneNumber || !address || !shoptime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (
      !address.street ||
      !address.pincode ||
      !address.city ||
      !address.state
    ) {
      return res
        .status(400)
        .json({ message: "Complete address details are required" });
    }

    // Ensure the retailer does not already have a profile
    const existingRetailer = await RetailerDetails.findOne({ retailerId });
    if (existingRetailer) {
      return res
        .status(400)
        .json({ message: "Retailer details already exist" });
    }

    // Handle image upload
    let imageUrl = "";
    if (image) {
      try {
        const uploadedImage = await cloudinary.uploader.upload(image, {
          folder: "retailers",
          transformation: [{ width: 500, height: 500, crop: "fill" }],
        });
        imageUrl = uploadedImage.secure_url;
      } catch (uploadError) {
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadError.message });
      }
    }

    const retailerDetails = new RetailerDetails({
      shopname,
      phoneNumber,
      address: {
        street: address.street,
        pincode: address.pincode,
        city: address.city,
        state: address.state,
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

// Update Retailer Details
const updateDetails = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const { phoneNumber, shoptime, address, image } = req.body;

    const updateFields = {};
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (shoptime) updateFields.shoptime = shoptime;

    // Update address fields dynamically
    if (address) {
      updateFields.address = {};
      if (address.street) updateFields.address.street = address.street;
      if (address.pincode) updateFields.address.pincode = address.pincode;
      if (address.city) updateFields.address.city = address.city;
      if (address.state) updateFields.address.state = address.state;
    }

    // Handle image upload
    if (image) {
      try {
        const uploadedImage = await cloudinary.uploader.upload(image, {
          folder: "retailers",
          transformation: [{ width: 500, height: 500, crop: "fill" }],
        });
        updateFields.photo = uploadedImage.secure_url;
      } catch (uploadError) {
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadError.message });
      }
    }

    const updatedRetailer = await RetailerDetails.findOneAndUpdate(
      { retailerId },
      { $set: updateFields },
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

export { createRetailerDetails, getRetailerDetails, updateDetails };
