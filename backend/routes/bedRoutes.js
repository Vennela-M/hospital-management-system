const express = require("express");
const router = express.Router();
const Bed = require("../models/Bed");

// ✅ CREATE BED (THIS IS MISSING IN YOUR CASE)
router.post("/", async (req, res) => {
  try {
    const bed = await Bed.create(req.body);
    res.json(bed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL BEDS
router.get("/", async (req, res) => {
  const beds = await Bed.find().populate("patient");
  res.json(beds);
});

// ASSIGN BED
router.put("/assign", async (req, res) => {
  try {
    const { bedId, patientId } = req.body;

    const bed = await Bed.findById(bedId);

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