const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: false },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Paid", "Processed"], default: "Pending" },
  notes: { type: String, default: "" }
});

module.exports = mongoose.model("Billing", billingSchema);