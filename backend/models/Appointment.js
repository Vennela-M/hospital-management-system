const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", default: null },
  date: { type: String, required: true },
  time: { type: String, required: true },
  consultationType: { type: String, enum: ["online", "inperson"], default: "inperson" },
  status: { type: String, enum: ["pending", "hold", "paid", "assigned", "confirmed", "completed", "cancelled"], default: "pending" },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription", default: null },
  consultationFee: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", AppointmentSchema);