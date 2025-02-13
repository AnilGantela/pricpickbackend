const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotEnv = require("dotenv");
dotEnv.config();
const Retailer = require("../models/Retailer"); // Adjust based on your file structure
const Product = require("../models/Product"); // Adjust based on your file structure

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, discount } = req.body;

    const token = req.headers.authorization?.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );
    const retailerId = decoded.id;

    if (!retailerId) {
      return res.status(400).json({ message: "Retailer ID is required." });
    }

    // Validate if the retailer exists
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
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Update a product

const updateProduct = async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.headers.authorization?.split(" ")[1]; // Assuming JWT token is sent in the Authorization header

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token is required" });
    }

    // Step 1: Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key here
    const userId = decoded.userId; // Assuming JWT contains userId field

    // Step 2: Find the retailer by userId
    const retailer = await Retailer.findOne({ userId });

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    // Step 3: Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, retailer.password);

    if (!isPasswordValid) {
      return res
        .status(403)
        .json({ message: "Invalid password. Access denied." });
    }

    // Step 4: Proceed to update the product if the password is correct
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
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Delete a product

const deleteProduct = async (req, res) => {
  try {
    const { password } = req.body; // Assuming the password is sent in the body of the request
    const token = req.headers.authorization?.split(" ")[1]; // Assuming JWT token is sent in the Authorization header

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token is required" });
    }

    // Step 1: Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key here
    const userId = decoded.userId; // Assuming JWT contains userId field

    // Step 2: Find the retailer by userId
    const retailer = await Retailer.findOne({ userId });

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    // Step 3: Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, retailer.password);

    if (!isPasswordValid) {
      return res
        .status(403)
        .json({ message: "Invalid password. Access denied." });
    }

    // Step 4: Proceed to delete the product if the password is correct
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
// Get all featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true });
    res.status(200).json(featuredProducts);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Apply discount to a product
const applyDiscount = async (req, res) => {
  try {
    const { discount } = req.body;

    if (discount < 0 || discount > 100) {
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
    console.error("Error applying discount:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const getRetailerProducts = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized. No token provided." });
    }

    // Verify token and extract retailerId
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );
    const retailerId = decoded.id;

    if (!retailerId) {
      return res
        .status(400)
        .json({ message: "Retailer ID not found in token." });
    }

    // Check if the retailer exists
    const retailer = await Retailer.findById(retailerId);
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found." });
    }

    // Fetch products belonging to the retailer
    const products = await Product.find({ retailerId });

    res
      .status(200)
      .json({ message: "Products retrieved successfully.", products });
  } catch (error) {
    console.error("Error fetching retailer products:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  getRetailerProducts,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  applyDiscount,
};
