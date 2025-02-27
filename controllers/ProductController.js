const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotEnv = require("dotenv");
const mongoose = require("mongoose");
dotEnv.config();

const Retailer = require("../models/Retailer");
const RetailerDetails = require("../models/RetailerDetails");
const Product = require("../models/Product");

// Middleware to verify JWT
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

// Create a new product
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, discount } = req.body;
    const decoded = verifyToken(req);
    const retailerId = decoded.id;

    if (!mongoose.Types.ObjectId.isValid(retailerId)) {
      return res.status(400).json({ message: "Invalid retailer ID." });
    }

    const retailer = await Retailer.findById(retailerId);
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found." });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      stock,
      discount,
      retailerId,
    });

    const savedProduct = await newProduct.save();
    retailer.products.push(savedProduct._id);
    await retailer.save();

    res
      .status(201)
      .json({ message: "Product created successfully", product: savedProduct });
  } catch (error) {
    console.error("Error creating product:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const decoded = verifyToken(req);
    const retailerId = decoded.id;

    const retailer = await Retailer.findById(retailerId);
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, retailer.password);
    if (!isPasswordValid) {
      return res
        .status(403)
        .json({ message: "Invalid password. Access denied." });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const decoded = verifyToken(req);
    const retailerId = decoded.id;

    const retailer = await Retailer.findById(retailerId);
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, retailer.password);
    if (!isPasswordValid) {
      return res
        .status(403)
        .json({ message: "Invalid password. Access denied." });
    }

    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Apply discount to a product
const applyDiscount = async (req, res) => {
  try {
    const { discount } = req.body;

    if (typeof discount !== "number" || discount < 0 || discount > 100) {
      return res.status(400).json({ message: "Invalid discount percentage." });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { discount },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Discount applied successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error applying discount:", error.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Get all products of a retailer
const getRetailerProducts = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const retailerId = decoded.id;

    if (!mongoose.Types.ObjectId.isValid(retailerId)) {
      return res.status(400).json({ message: "Invalid retailer ID." });
    }

    const retailer = await Retailer.findById(retailerId);
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found." });
    }

    const products = await Product.find({ retailerId });

    res
      .status(200)
      .json({ message: "Products retrieved successfully.", products });
  } catch (error) {
    console.error("Error fetching retailer products:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const getProductCategoryData = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const retailerId = decoded.id;

    const categories = await Product.aggregate([
      { $match: { retailerId: new mongoose.Types.ObjectId(retailerId) } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { _id: 0, category: "$_id", count: 1 } },
    ]);

    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching product categories:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  applyDiscount,
  getRetailerProducts,
  getProductCategoryData,
};
