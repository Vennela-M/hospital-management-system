const express = require("express");
const router = express.Router();
const User = require("../models/User");
const upload = require("../middleware/upload");

// GET PROFILE
router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (optional) UPDATE PROFILE
router.put("/profile/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

router.post("/upload-report/:id", upload.single("report"), async (req, res) => {
  try {

    // ✅ ADD THIS HERE (FIRST THING)
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.reports.push(req.file.filename);
    await user.save();

    res.json({ message: "Report uploaded", reports: user.reports });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});