const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Bed = require("../models/Bed");

// ✅ STATS ROUTE (THIS IS WHAT YOU ARE MISSING)
router.get("/stats", async (req, res) => {
  try {
    const patients = await Patient.countDocuments();
    const doctors = await User.countDocuments({ role: "doctor" });
    const appointments = await Appointment.countDocuments();
    const beds = await Bed.countDocuments();

    res.json({
      patients,
      doctors,
      appointments,
      beds
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APPOINTMENTS
router.get("/appointments", async (req, res) => {
  try {
    const data = await Appointment.find()
      .populate("patient")
      .populate("doctor");

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BEDS
router.get("/beds", async (req, res) => {
  try {
    const beds = await Bed.find().populate("patient");
    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;