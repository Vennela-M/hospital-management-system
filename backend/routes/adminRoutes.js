const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth, requireRole } = require("../middleware/auth");


// ✅ GET ALL USERS
router.get("/users", auth, requireRole(["admin"]), async (req, res) => {
  const users = await User.find();
  res.json(users);
});


// ✅ GET ALL DOCTORS
router.get("/doctors", auth, requireRole(["admin"]), async (req, res) => {
  const doctors = await User.find({ role: "doctor" });
  res.json(doctors);
});


// ✅ DELETE USER
router.delete("/user/:id", auth, requireRole(["admin"]), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

module.exports = router;