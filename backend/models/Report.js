const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: false },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: false },
  reportType: { type: String, required: true }, // Blood Test, X-Ray, ECG, etc.
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  description: { type: String, default: "" },
  findings: { type: String, default: "" },
  status: { type: String, enum: ["pending", "reviewed"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
