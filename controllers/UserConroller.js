const User = require("../models/User");
const Search = require("../models/Search");

const saveUserDetails = async (req, res) => {
  try {
    const { id, fullName, primaryEmailAddress, imageUrl } = req.body;

    if (!id || !fullName || !primaryEmailAddress || !imageUrl) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    let user = await User.findOne({ clerkId: id });

    if (!user) {
      user = new User({
        clerkId: id,
        username: fullName,
        email: primaryEmailAddress,
        profileImage: imageUrl,
      });
      await user.save();
    }

    res.status(200).json({ message: "User details saved successfully.", user });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error });
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

    const searches = await Search.find({ userId: user._id });
    const searchCount = searches.length;

    res.status(200).json({ searches, searchCount });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error });
  }
};

const addOrUpdateSearch = async (req, res) => {
  try {
    const { clerkId, query } = req.body;
    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let searchEntry = await Search.findOne({ query });

    if (searchEntry) {
      searchEntry.count += 1;
      if (!searchEntry.userIds.includes(user._id)) {
        searchEntry.userIds.push(user._id);
      }
      await searchEntry.save();
    } else {
      searchEntry = await Search.create({
        query,
        userIds: [user._id],
        count: 1,
      });
    }

    await User.findByIdAndUpdate(user._id, {
      $push: { searchIds: searchEntry._id },
    });
    res
      .status(200)
      .json({ message: "Search added/updated successfully.", searchEntry });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error });
  }
};

module.exports = {
  saveUserDetails,
  getUserDetails,
  getUserSearches,
  addOrUpdateSearch,
};
