const mongoose = require("mongoose");

const siteStatusSchema = new mongoose.Schema({
  isTemporarilyClosed: {
    type: Boolean,
    default: false,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  reason: {
    type: String,
    default: "",
  },
});

// Ensure only one document exists
siteStatusSchema.statics.getSiteStatus = async function () {
  let status = await this.findOne();
  if (!status) {
    status = await this.create({
      isTemporarilyClosed: false,
      lastUpdated: new Date(),
    });
  }
  return status;
};

siteStatusSchema.statics.updateSiteStatus = async function (
  isTemporarilyClosed,
  updatedBy = null,
  reason = ""
) {
  let status = await this.findOne();
  if (!status) {
    status = new this({
      isTemporarilyClosed,
      lastUpdated: new Date(),
      updatedBy,
      reason,
    });
  } else {
    status.isTemporarilyClosed = isTemporarilyClosed;
    status.lastUpdated = new Date();
    status.updatedBy = updatedBy;
    status.reason = reason;
  }

  await status.save();
  return status;
};

module.exports = mongoose.model("SiteStatus", siteStatusSchema);
