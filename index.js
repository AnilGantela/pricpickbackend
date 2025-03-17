const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const retailerRoutes = require("./routes/RetailerRoute");
const productRoutes = require("./routes/ProductRoutes");
const userProducts = require("./routes/userProducts");

const cors = require("cors");
app.use(
  cors({
    origin: ["https://pricepickretailer.vercel.app", "http://localhost:5173"], // Allow only this domain
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    credentials: true, // Allow cookies (if needed)
  })
);
const dotEnv = require("dotenv");
dotEnv.config();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Hello");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("database connected");
  })
  .catch((error) => {
    console.log(error);
  });

app.use(bodyParser.json());
app.use("/home", (req, res) => {
  res.send("<h1>Welcome to home page</h1>");
  console.log("home page");
});

app.use("/retailer", retailerRoutes);
app.use("/retailer/product", productRoutes);
app.use("/user/", userProducts);
