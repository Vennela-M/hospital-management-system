const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");


// ✅ CREATE APPOINTMENT
router.post("/", async (req, res) => {
  try {
    const { patient, doctor, date, time, notes, followUpDays } = req.body;

    // check slot already booked
    const exists = await Appointment.findOne({ doctor, date, time });
    if (exists) {
      return res.status(400).json({ message: "Doctor already booked" });
    }

    let nextVisitDate = null;

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

    res.json(appointment);

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET ALL APPOINTMENTS (IMPORTANT FIX HERE)
router.get("/", async (req, res) => {
  try {
    const data = await Appointment.find()
      .populate("patient", "name age")
      .populate("doctor", "name");

    res.json(data);

  } catch (err) {
    console.error("GET ERROR:", err);
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