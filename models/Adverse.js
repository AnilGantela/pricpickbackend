const mongoose = require("mongoose");

const adCampaignSchema = new mongoose.Schema(
  {
    retailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Retailer",
      required: true,
    },
    shopname: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    bannerImage: {
      type: String,
      required: true,
    },
    mobileBanner: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // Geo-targeting
    targetLocation: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
    },

    // Define target type: either "city" or "state"
    targetType: {
      type: String,
      enum: ["city", "state"],
      required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Middleware to auto-filter expired campaigns (optional)
adCampaignSchema.pre("find", function () {
  this.where({ endDate: { $gte: new Date() } });
});

adCampaignSchema.pre("findOne", function () {
  this.where({ endDate: { $gte: new Date() } });
});

// Static method to deactivate expired campaigns
adCampaignSchema.statics.deactivateExpired = async function () {
  await this.updateMany(
    { endDate: { $lt: new Date() }, isActive: true },
    { $set: { isActive: false } }
  );
};

module.exports = mongoose.model("AdCampaign", adCampaignSchema);
