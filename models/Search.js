const mongoose = require("mongoose");

const SearchSchema = new mongoose.Schema({
  query: { type: String, required: true },
  results: { type: Array, default: [] },
  searchCount: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Search", SearchSchema);
