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

// ================= ADD =================
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { name, age, gender, phone, address, disease, admitted, symptoms, area } = req.body;

    // Prevent duplicate
    const exists = await User.findOne({ name, age, gender });
    if (exists) {
      return res.status(400).json({ message: "Patient already exists" });
    }

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