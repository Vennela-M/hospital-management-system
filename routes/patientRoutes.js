const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Patient = require("../models/Patient");

// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ADD =================
router.post("/", async (req, res) => {
  try {
    const { name, age, gender } = req.body;

    // Prevent duplicate
    const exists = await Patient.findOne({ name, age, gender });
    if (exists) {
      return res.status(400).json({ message: "Patient already exists" });
    }

    const patient = await Patient.create({ name, age, gender });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const deleted = await Patient.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;