const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const upload = require("../middleware/upload");
const { auth, requireRole } = require("../middleware/auth");

// CREATE REPORT ENTRY
router.post("/", auth, requireRole(["doctor", "admin"]), async (req, res) => {
  try {
    const { patient, hospital, appointment, reportType, fileName, filePath, description } = req.body;
    
    const report = await Report.create({
      patient,
      doctor: req.user.role === "doctor" ? req.user._id : undefined,
      hospital,
      appointment,
      reportType,
      fileName,
      filePath,
      description
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PATIENT REPORTS
router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const reports = await Report.find({ patient: req.params.patientId })
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD REPORT
router.post("/upload/:patientId", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const report = await Report.create({
      patient: req.params.patientId,
      doctor: req.user.role === "doctor" ? req.user._id : undefined,
      reportType: req.body.reportType || "General",
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      description: req.body.description || ""
    });

    res.status(201).json({ message: "Report uploaded", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE REPORT
router.put("/:id", auth, requireRole(["doctor", "admin"]), async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
