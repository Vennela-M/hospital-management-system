const express = require("express");
const router = express.Router();
const OutbreakAlert = require("../models/OutbreakAlert");
const { auth, requireRole } = require("../middleware/auth");

// CREATE OUTBREAK ALERT (admin)
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { hospital, title, description, severity, diseaseName, affectedAreas, precautions, startDate, endDate } = req.body;
    
    const alert = await OutbreakAlert.create({
      hospital,
      title,
      description,
      severity,
      diseaseName,
      affectedAreas,
      precautions,
      startDate,
      endDate,
      createdBy: req.user._id
    });

    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ACTIVE ALERTS (public or with role)
router.get("/", async (req, res) => {
  try {
    const alerts = await OutbreakAlert.find({ isActive: true })
      .populate("hospital", "name address")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET HOSPITAL ALERTS
router.get("/hospital/:hospitalId", async (req, res) => {
  try {
    const alerts = await OutbreakAlert.find({ 
      hospital: req.params.hospitalId,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ALERT
router.put("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const alert = await OutbreakAlert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DEACTIVATE ALERT
router.put("/:id/deactivate", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const alert = await OutbreakAlert.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
