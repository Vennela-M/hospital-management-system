const mongoose = require("mongoose");

const outbreakAlertSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  diseaseName: { type: String, required: true },
  affectedAreas: { type: String, default: "" },
  precautions: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("OutbreakAlert", outbreakAlertSchema);
