const express = require("express");
const router = express.Router();
const Bed = require("../models/Bed");
const mongoose = require("mongoose");
const { auth, requireRole } = require("../middleware/auth");

// ✅ CREATE BED (THIS IS MISSING IN YOUR CASE)
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { bedNumber, type } = req.body;
    if (!bedNumber || !type) {
      return res.status(400).json({ message: "bedNumber and type are required" });
    }
    const bed = await Bed.create(req.body);
    res.status(201).json(bed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL BEDS
router.get("/", auth, async (req, res) => {
  try {
    const beds = await Bed.find().populate("patient");
    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ASSIGN BED
router.put("/assign", auth, requireRole(["admin", "doctor"]), async (req, res) => {
  try {
    const { bedId, patientId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(bedId) || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Valid bedId and patientId are required" });
    }

    const bed = await Bed.findById(bedId);
    if (!bed) {
      return res.status(404).json({ message: "Bed not found" });
    }

    if (bed.isOccupied) {
      return res.status(400).json({ message: "Bed already occupied" });
    }

    bed.isOccupied = true;
    bed.patient = patientId;

    await bed.save();

    res.json({ message: "Bed assigned" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

module.exports = router;