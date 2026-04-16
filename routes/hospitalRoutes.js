const express = require("express");
const router = express.Router();
const Hospital = require("../models/Hospital");


// ✅ CREATE HOSPITAL
router.post("/", async (req, res) => {
    try {
      const hospital = await Hospital.create(req.body);
      res.json(hospital);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// ✅ GET HOSPITALS
router.get("/", async (req, res) => {
    try {
      const data = await Hospital.find();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


// ✅ UPDATE BEDS
router.put("/:id", async (req, res) => {
  const updated = await Hospital.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

module.exports = router;