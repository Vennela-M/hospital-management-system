const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const mongoose = require("mongoose");


// ✅ CREATE APPOINTMENT
router.post("/", async (req, res) => {
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
router.get("/", async (req, res) => {
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
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    const data = await Appointment.find({ doctor: doctorId })
      .populate("patient", "name age email");

    res.json(data);

  } catch (err) {
    console.error("DOCTOR APPOINTMENTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET APPOINTMENTS BY USER (PATIENT)
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const data = await Appointment.find({ patient: patientId })
      .populate("doctor", "name specialization");

    res.json(data);

  } catch (err) {
    console.error("PATIENT APPOINTMENTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ UPDATE STATUS (IMPORTANT FEATURE 🔥)
router.put("/:id", async (req, res) => {
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


// ✅ DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

// ✅ ADD PRESCRIPTION
router.put("/prescription/:id", async (req, res) => {
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
router.post("/book", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Appointment.findByIdAndDelete(id);

    res.json({ message: "Appointment deleted successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});