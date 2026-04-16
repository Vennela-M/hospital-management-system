const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const User = require("../models/User");


// ✅ UPLOAD REPORT
router.post("/upload-report/:id", upload.single("report"), async (req, res) => {
  try {
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

module.exports = router;