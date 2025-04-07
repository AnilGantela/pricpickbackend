const mongoose = require("mongoose");

const SearchSchema = new mongoose.Schema({
  query: { type: String, required: true },
  searchCount: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

SearchSchema.index({ query: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Search", SearchSchema);
