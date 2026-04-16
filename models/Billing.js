const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  amount: Number,
  status: { type: String, default: "Pending" }
});

module.exports = mongoose.model("Billing", billingSchema);