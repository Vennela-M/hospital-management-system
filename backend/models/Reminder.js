const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["medication", "appointment", "checkup"], required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  frequency: { type: String, enum: ["daily", "weekly", "monthly", "once"], default: "daily" },
  dayOfWeek: { type: Number, default: null }, // 0-6 for weekly
  dayOfMonth: { type: Number, default: null }, // 1-31 for monthly
  time: { type: String, required: true }, // HH:MM format
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  lastSent: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Reminder", reminderSchema);
