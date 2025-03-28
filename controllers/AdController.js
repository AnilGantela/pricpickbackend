const AdCampaign = require("../models/AdCampaign");
const RetailerDetails = require("../models/RetailerDetails");

// Add a new campaign
exports.createAdCampaign = async (req, res) => {
  try {
    const {
      retailerId,
      title,
      bannerImage,
      mobileBanner,
      description,
      productIds,
      targetLocation,
      targetType,
      endDate,
    } = req.body;

    // Fetch shopname from RetailerDetails using retailerId
    const retailerDetails = await RetailerDetails.findOne({ retailerId });
    if (!retailerDetails) {
      return res.status(404).json({ error: "Retailer details not found" });
    }

    const campaign = new AdCampaign({
      retailerId,
      shopname: retailerDetails.shopname,
      title,
      bannerImage,
      mobileBanner,
      description,
      productIds,
      targetLocation,
      targetType,
      endDate,
    });

    await campaign.save();
    res.status(201).json({ message: "Ad campaign created", campaign });
  } catch (error) {
    console.error("Create Campaign Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all active campaigns (optional filter by city or state)
exports.getActiveCampaigns = async (req, res) => {
  try {
    const { city, state } = req.query;

    const filter = {
      isActive: true,
      endDate: { $gte: new Date() },
    };

    if (city) {
      filter["targetLocation.city"] = city;
      filter.targetType = "city";
    } else if (state) {
      filter["targetLocation.state"] = state;
      filter.targetType = "state";
    }

    const campaigns = await AdCampaign.find(filter).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    console.error("Get Campaigns Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Manually deactivate expired campaigns (can be scheduled)
exports.deactivateExpiredCampaigns = async (req, res) => {
  try {
    const result = await AdCampaign.deactivateExpired();
    res.json({ message: "Expired campaigns deactivated", result });
  } catch (error) {
    console.error("Deactivate Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get campaigns by retailer
exports.getCampaignsByRetailer = async (req, res) => {
  try {
    const { retailerId } = req.params;
    const campaigns = await AdCampaign.find({ retailerId }).sort({
      createdAt: -1,
    });
    res.json(campaigns);
  } catch (error) {
    console.error("Retailer Campaigns Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Reactivate an expired campaign by ID
exports.reactivateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await AdCampaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Check if the campaign's endDate is still in the past
    if (new Date(campaign.endDate) < new Date()) {
      return res
        .status(400)
        .json({ error: "Cannot reactivate. Campaign endDate is in the past." });
    }

    campaign.isActive = true;
    await campaign.save();

    res.json({ message: "Campaign reactivated", campaign });
  } catch (error) {
    console.error("Reactivate Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
