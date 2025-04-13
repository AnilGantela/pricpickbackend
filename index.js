const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotEnv = require("dotenv");

const retailerRoutes = require("./routes/RetailerRoute");
const productRoutes = require("./routes/ProductRoutes");
const userProducts = require("./routes/userProducts");
const userRoutes = require("./routes/UserRoutes");
const orderRoutes = require("./routes/OrderRoutes");
// Load environment variables
dotEnv.config();

// Middleware
app.use(
  cors({
    origin: ["https://pricepickretailer.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Increase payload size limits to handle large JSON or base64 image data
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Database connected");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });

// Routes
app.use("/home", (req, res) => {
  res.send("<h1>Welcome to home page</h1>");
  console.log("🟢 Home page hit");
});

app.use("/retailer", retailerRoutes);
app.use("/retailer/product", productRoutes);
app.use("/user", userProducts);
app.use("/app", userRoutes);
app.use("/orders", orderRoutes);

// Server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
