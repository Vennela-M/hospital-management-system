const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post("/book-appointment", async (req, res) => {
  try {
    const { userId, doctorId } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.json({ message: "User not found" });

    user.appointments.push(doctorId);

    await user.save();

    res.json({ message: "Appointment booked successfully" });
  } catch (err) {
    res.json({ error: err.message });
  }
});

module.exports = router;