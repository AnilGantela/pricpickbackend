const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  username: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  profileImage: { type: String, required: true },
  searchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Search" }],
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
