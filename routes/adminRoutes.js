const express = require("express");
const router = express.Router();
const User = require("../models/User");


// ✅ GET ALL USERS
router.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});


// ✅ GET ALL DOCTORS
router.get("/doctors", async (req, res) => {
  const doctors = await User.find({ role: "doctor" });
  res.json(doctors);
});


// ✅ DELETE USER
router.delete("/user/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

module.exports = router;