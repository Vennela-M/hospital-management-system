const express = require("express");
const router = express.Router();
const Hospital = require("../models/Hospital");
const { auth, requireRole } = require("../middleware/auth");


// ✅ CREATE HOSPITAL
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
    try {
      const hospital = await Hospital.create(req.body);
      res.json(hospital);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// ✅ GET HOSPITALS
router.get("/", auth, async (req, res) => {
    try {
      const data = await Hospital.find();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


// ✅ UPDATE BEDS
router.put("/:id", auth, requireRole(["admin"]), async (req, res) => {
  const updated = await Hospital.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

module.exports = router;