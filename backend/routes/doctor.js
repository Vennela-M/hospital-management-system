const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ✅ ADD THIS (main fix)
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Existing routes
router.get("/patients/:doctorId", async (req, res) => {
  try {
    const patients = await User.find({
      role: "user",
      appointments: req.params.doctorId
    });
    res.json(patients);
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post("/set-availability", async (req, res) => {
  try {
    const { doctorId, availability } = req.body;

    const doctor = await User.findById(doctorId);

    if (!doctor) return res.json({ message: "Doctor not found" });

    doctor.availability = availability;

    await doctor.save();

    res.json({ message: "Availability updated" });
  } catch (err) {
    res.json({ error: err.message });
  }
});

module.exports = router;