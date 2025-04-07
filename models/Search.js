const mongoose = require("mongoose");

const SearchSchema = new mongoose.Schema({
  query: { type: String, required: true, unique: true },
  searchCount: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
});

module.exports = mongoose.model("Search", SearchSchema);
