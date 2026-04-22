const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Hospital = require("../models/Hospital");
const { auth, requireRole } = require("../middleware/auth");


// ✅ GET ALL USERS
router.get("/users", auth, requireRole(["admin"]), async (req, res) => {
  const users = await User.find();
  res.json(users);
});


// ✅ GET ALL DOCTORS
router.get("/doctors", auth, requireRole(["admin"]), async (req, res) => {
  const doctors = await User.find({ role: "doctor" });
  res.json(doctors);
});


// ✅ GET PATIENT BY PATIENT ID
router.get("/patient/:patientId", auth, requireRole(["admin"]), async (req, res) => {
  const patient = await User.findOne({ patientId: req.params.patientId, role: "user" });
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  res.json(patient);
});

// ✅ ASSIGN DOCTOR TO APPOINTMENT
router.put("/appointment/:id/assign", auth, requireRole(["admin"]), async (req, res) => {
  const { doctorId } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  appointment.doctor = doctorId;
  appointment.status = "assigned";
  await appointment.save();
  res.json({ message: "Doctor assigned successfully" });
});

// ✅ MARK PAYMENT AS PAID
router.put("/appointment/:id/pay", auth, requireRole(["admin"]), async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  appointment.paymentStatus = "paid";
  appointment.status = "paid";
  await appointment.save();
  res.json({ message: "Payment marked as paid" });
});

// ✅ GET ALL HOSPITALS
router.get("/hospitals", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const hospitals = await Hospital.find().populate('doctors', 'name specialization');
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET HOSPITAL BY ID
router.get("/hospitals/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).populate('doctors', 'name specialization');
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE HOSPITAL
router.put("/hospitals/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const updated = await Hospital.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('doctors', 'name specialization');
    if (!updated) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;