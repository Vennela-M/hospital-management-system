const express = require("express");
const router = express.Router();
const Reminder = require("../models/Reminder");
const { auth, requireRole } = require("../middleware/auth");

// CREATE REMINDER (patient)
router.post("/", auth, requireRole(["user"]), async (req, res) => {
  try {
    const { type, title, description, frequency, time, startDate, endDate, dayOfWeek, dayOfMonth } = req.body;
    
    const reminder = await Reminder.create({
      patient: req.user._id,
      type,
      title,
      description,
      frequency,
      time,
      startDate,
      endDate,
      dayOfWeek,
      dayOfMonth,
      isActive: true
    });

    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PATIENT REMINDERS
router.get("/", auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ patient: req.user._id });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE REMINDER
router.put("/:id", auth, async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE REMINDER
router.delete("/:id", auth, async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
