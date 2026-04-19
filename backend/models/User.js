const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  // 🔹 UNIQUE PATIENT ID (for reference - patients only)
  patientId: { 
    type: String, 
    unique: true, 
    sparse: true,
    default: null 
  },

  // 🔹 UNIQUE DOCTOR ID (for reference - doctors only)
  doctorId: { 
    type: String, 
    unique: true, 
    sparse: true,
    default: null 
  },

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
  },

  availability: {
    type: Object,
    default: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
  },

  questions: [
    {
      patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      question: { type: String, default: "" },
      answer: { type: String, default: "" },
      status: {
        type: String,
        enum: ["open", "answered"],
        default: "open"
      },
      createdAt: { type: Date, default: Date.now }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);