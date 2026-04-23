const express = require("express");
const router = express.Router();

const {
  getProfiles,
  getProfileById,
} = require("../controllers/profilesController");
const { searchProfiles } = require("../controllers/searchController");
const {
  validateProfilesQuery,
  validateSearchQuery,
} = require("../middleware/validate");

// /search MUST be before /:id
router.get("/search", validateSearchQuery, searchProfiles);
router.get("/", validateProfilesQuery, getProfiles);
router.get("/:id", getProfileById);

module.exports = router;
