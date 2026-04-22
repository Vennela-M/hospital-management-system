const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const { auth, requireRole } = require("../middleware/auth");

// ================= GET ALL =================
router.get("/", auth, requireRole(["admin", "doctor"]), async (req, res) => {
  try {
    const patients = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET ONE =================
router.get("/:id", auth, requireRole(["admin", "doctor"]), async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const patient = await User.findOne({ _id: id, role: "user" });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SEARCH BY PATIENT REF =================
router.get("/search/:patientId", auth, requireRole(["admin", "doctor"]), async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ message: "Patient reference id is required" });
    }

    const patient = await User.findOne({ patientId, role: "user" });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const Appointment = require("../models/Appointment");
    const appointments = await Appointment.find({ patient: patient._id })
      .populate("doctor", "name specialization doctorId");

    res.json({ patient, appointments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ADD =================
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { name, age, gender, phone, address, disease, admitted, symptoms, area } = req.body;

    // Prevent duplicate
    const exists = await User.findOne({ name, age, gender });
    if (exists) {
      return res.status(400).json({ message: "Patient already exists" });
    }

    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const patientId = `PA${randomNum.toString().padStart(4, '0')}`;

    const patient = await User.create({ 
      name, 
      age, 
      gender, 
      phone, 
      address, 
      diseases: disease, 
      admitted, 
      symptoms, 
      area,
      patientId,
      role: "user"
    });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DELETE =================
router.delete("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const deleted = await User.findOneAndDelete({ _id: id, role: "user" });

    if (!deleted) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;