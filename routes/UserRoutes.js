const express = require("express");
const {
  saveUserDetails,
  getUserDetails,
  getUserSearches,
  addOrUpdateSearch,
} = require("../controllers/UserController");

const router = express.Router();

// Save user details from Clerk
router.post("/saveUser", saveUserDetails);

// Get user details by Clerk ID
router.get("/user/:clerkId", getUserDetails);

// Get all searches of a user and their count
router.get("/user/:clerkId/searches", getUserSearches);

// Add or update a user's search query
router.post("/user/:clerkId/addsearch", addOrUpdateSearch);

module.exports = router;
