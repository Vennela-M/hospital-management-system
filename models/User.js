const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,

  role: {
    type: String,
    enum: ["user", "doctor", "admin"],
    default: "user"
  },

  specialization: String,
  hospital: String,

  // Personal details
  age: Number,
  gender: String,
  bloodGroup: String,

  // Medical details
  address: String,
  diseases: String,
  allergies: String,
  medications: String,
  height: String,
  weight: String,
  surgeries: String,
  conditions: String,

  // Reports
  reports: [String]

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);