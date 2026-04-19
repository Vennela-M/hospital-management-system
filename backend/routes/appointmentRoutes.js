const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const mongoose = require("mongoose");
const { auth, requireRole } = require("../middleware/auth");


// ✅ CREATE APPOINTMENT
router.post("/", auth, async (req, res) => {
  try {
    const { patient, doctor, date, time, notes, followUpDays } = req.body;

    if (!patient || !doctor || !date || !time) {
      return res.status(400).json({ message: "patient, doctor, date and time are required" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(patient) ||
      !mongoose.Types.ObjectId.isValid(doctor)
    ) {
      return res.status(400).json({ message: "Invalid patient or doctor id" });
    }

    // 🔥 Prevent double booking
    const exists = await Appointment.findOne({ doctor, date, time });
    if (exists) {
      return res.status(400).json({ message: "Doctor already booked" });
    }

    let nextVisitDate = null;

    // 🔥 Follow-up logic
    if (followUpDays) {
      const base = new Date(date);
      base.setDate(base.getDate() + Number(followUpDays));
      nextVisitDate = base;
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      date,
      time,
      notes,
      nextVisitDate
    });

    res.status(201).json(appointment);

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET ALL APPOINTMENTS (with full details)
router.get("/", auth, requireRole(["admin", "doctor"]), async (req, res) => {
  try {
    const data = await Appointment.find()
      .populate("patient", "name age email")
      .populate("doctor", "name specialization");

    res.json(data);

  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET APPOINTMENTS BY DOCTOR (VERY IMPORTANT 🔥)
router.get("/doctor/:doctorId", auth, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Allow doctor to see their own, or admin to see any
    if (req.user.role !== "admin" && req.user._id.toString() !== doctorId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const data = await Appointment.find({ doctor: doctorId })
      .populate("patient", "name age email");

    res.json(data);

  } catch (err) {
    console.error("DOCTOR APPOINTMENTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET APPOINTMENTS BY USER (PATIENT)
router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Allow patient to see their own, or admin/doctor
    if (req.user.role === "user" && req.user._id.toString() !== patientId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const data = await Appointment.find({ patient: patientId })
      .populate("doctor", "name specialization");

    res.json(data);

  } catch (err) {
    console.error("PATIENT APPOINTMENTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ UPDATE STATUS (IMPORTANT FEATURE 🔥)
router.put("/:id", auth, requireRole(["admin", "doctor"]), async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ REMINDERS
router.get("/reminders", async (req, res) => {
  try {
    const today = new Date();

    const reminders = await Appointment.find({
      nextVisitDate: { $ne: null, $gte: today }
    })
      .populate("patient", "name")
      .populate("doctor", "name");

    res.json(reminders);

  } catch (err) {
    console.error("REMINDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ DELETE (allow patient to delete their own or admin to delete any)
router.delete("/:id", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Allow patient to delete their own, or admin to delete any
    if (req.user.role === "user" && req.user._id.toString() !== appointment.patient.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const deleted = await Appointment.findByIdAndDelete(req.params.id);

    res.json({ message: "Appointment deleted successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ SEARCH APPOINTMENTS (by patient name or appointment details)
router.get("/search/:query", auth, async (req, res) => {
  try {
    const { query } = req.params;

    // Search in appointments
    const appointments = await Appointment.find({
      $or: [
        { notes: { $regex: query, $options: "i" } },
        { date: { $regex: query, $options: "i" } },
        { time: { $regex: query, $options: "i" } }
      ]
    })
    .populate("patient", "name email phone")
    .populate("doctor", "name specialization");

    res.json(appointments);

  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

// ✅ ADD PRESCRIPTION
router.put("/prescription/:id", auth, requireRole(["admin", "doctor"]), async (req, res) => {
  try {
    const { prescription } = req.body;

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { prescription },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(updated);

  } catch (err) {
    console.error("PRESCRIPTION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/book", auth, async (req, res) => {
  try {
    const { name, hospital, doctor, date } = req.body;

    const appointment = new Appointment({
      hospital,
      doctor,
      date,
      patient: name // or userId if you have
    });

    await appointment.save();

    res.json({ message: "Appointment booked successfully" });

  } catch (err) {
    console.error("BOOK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;