const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Appointment = require("../models/Appointment");


//  ADD DOCTOR (profile creation)
router.post("/", async (req, res) => {
  try {
    const { name, email, specialization } = req.body;

    const doctor = await User.create({
      name,
      email,
      specialization,
      role: "doctor"
    });

    res.json(doctor);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  GET ALL DOCTORS
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  GET SINGLE DOCTOR PROFILE
router.get("/:id", async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  GET DOCTOR PATIENTS (CORRECT WAY)
router.get("/patients/:doctorId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctor: req.params.doctorId
    }).populate("patient");

    const patients = appointments.map(a => a.patient);

    res.json(patients);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  AUTO AVAILABILITY (BASED ON APPOINTMENTS)
router.get("/availability/:doctorId", async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const appointments = await Appointment.find({ doctor: doctorId });

    const allSlots = [
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "2:00 PM",
      "3:00 PM"
    ];

    const bookedSlots = appointments.map(a => a.time);

    const freeSlots = allSlots.filter(s => !bookedSlots.includes(s));

    res.json({
      bookedSlots,
      freeSlots
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;