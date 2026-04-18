const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  // 🔹 BASIC INFO
  name: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  password: { type: String, default: "" },

  role: {
    type: String,
    enum: ["user", "doctor", "admin"],
    default: "user"
  },

  // 🔹 DOCTOR INFO (only if doctor)
  specialization: { type: String, default: "" },
  hospital: { type: String, default: "" },

  // 🔹 PERSONAL DETAILS
  age: { type: Number, default: null },
  gender: { type: String, default: "" },
  bloodGroup: { type: String, default: "" },
  height: { type: String, default: "" },
  weight: { type: String, default: "" },
  address: { type: String, default: "" },

  // 🔹 MEDICAL DETAILS
  diseases: { type: String, default: "" },       // chronic diseases
  allergies: { type: String, default: "" },
  medications: { type: String, default: "" },
  surgeries: { type: String, default: "" },
  conditions: { type: String, default: "" },    // extra notes if needed

  // 🔹 EMERGENCY
  emergencyContactName: { type: String, default: "" },
  emergencyContactNumber: { type: String, default: "" },

  // 🔹 REPORTS
  reports: {
    type: [String],
    default: []
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);