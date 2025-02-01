const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const retailerRoutes = require("./routes/RetailerRoute");
const productRoutes = require("./routes/ProductRoutes");

const dotEnv = require("dotenv");
dotEnv.config();

const PORT = process.env.PORT || 4000;

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
