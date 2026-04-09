const express = require("express");
const router = express.Router();
const User = require("../models/User");

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();

    res.json({ message: "✅ User Registered Successfully" });
  } catch (error) {
    res.json({ message: "❌ Error in Signup" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
      password: req.body.password
    });

    if (!user) {
      return res.json({ message: "❌ Invalid Credentials" });
    }

    res.json(user);
  } catch (error) {
    res.json({ message: "❌ Login Error" });
  }
});

module.exports = router;