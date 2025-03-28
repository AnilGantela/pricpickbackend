const express = require("express");
const router = express.Router();
const adController = require("../controllers/adCampaignController");

router.post("/create", adController.createAdCampaign);
router.get("/active", adController.getActiveCampaigns);
router.get("/retailer/:retailerId", adController.getCampaignsByRetailer);
router.post("/deactivate-expired", adController.deactivateExpiredCampaigns);
router.post("/reactivate/:campaignId", adController.reactivateCampaign);

module.exports = router;
