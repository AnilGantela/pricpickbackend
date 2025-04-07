const User = require("../models/User");
const Search = require("../models/Search");

const saveUserDetails = async (req, res) => {
  try {
    const { id, fullName, primaryEmailAddress, imageUrl } = req.body;

    if (!id || !fullName || !primaryEmailAddress || !imageUrl) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const filter = {
      $or: [{ clerkId: id }, { email: primaryEmailAddress }],
    };

    const update = {
      clerkId: id,
      username: fullName,
      email: primaryEmailAddress,
      profileImage: imageUrl,
    };

    const options = { upsert: true, new: true };

    const updatedUser = await User.findOneAndUpdate(filter, update, options);

    res.status(200).json({
      message: "User saved or updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("🔥 saveUserDetails error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error.", error });
  }
};

const getUserSearches = async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const searches = await Search.find({ userId: user._id }).sort({
      createdAt: -1,
    });
    const searchCount = searches.reduce(
      (acc, curr) => acc + curr.searchCount,
      0
    );

    res.status(200).json({ searches, searchCount });
  } catch (error) {
    console.error("Error in getUserSearches:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const addOrUpdateSearch = async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { query } = req.body;

    if (!query || !clerkId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const existingSearch = await Search.findOne({ query, userId: user._id });

    if (existingSearch) {
      existingSearch.searchCount += 1;
      await existingSearch.save();
      return res
        .status(200)
        .json({ message: "Search updated.", search: existingSearch });
    }

    const newSearch = new Search({
      query,
      userId: user._id,
    });

    await newSearch.save();
    res.status(201).json({ message: "Search created.", search: newSearch });
  } catch (error) {
    console.error("Error in addOrUpdateSearch:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  saveUserDetails,
  getUserDetails,
  getUserSearches,
  addOrUpdateSearch,
};
