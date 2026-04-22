const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");
const { auth, requireRole } = require("../middleware/auth");

// CREATE PRESCRIPTION (doctor)
router.post("/", auth, requireRole(["doctor"]), async (req, res) => {
  try {
    const { patient, appointment, medications, diagnosis, instructions, followUpDate } = req.body;
    
    const prescription = await Prescription.create({
      patient,
      doctor: req.user._id,
      appointment,
      medications,
      diagnosis,
      instructions,
      followUpDate
    });

    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PATIENT PRESCRIPTIONS
router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.params.patientId })
      .populate("doctor", "name specialization doctorId")
      .sort({ createdAt: -1 });
    
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET DOCTOR PRESCRIPTIONS
router.get("/doctor/:doctorId", auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.params.doctorId })
      .populate("patient", "name email patientId")
      .sort({ createdAt: -1 });
    
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PRESCRIPTION
router.put("/:id", auth, requireRole(["doctor"]), async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
