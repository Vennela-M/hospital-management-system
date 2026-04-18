const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  patient: String,
  doctor: String,
  hospital: String,
  date: String
});

module.exports = mongoose.model("Appointment", AppointmentSchema);