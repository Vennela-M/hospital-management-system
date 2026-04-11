const express = require("express");
const router = express.Router();
const User = require("../models/User");

console.log("Hospital routes loaded");

router.get("/", (req, res) => {
  res.send("Hospital router working");
});

// Add doctor
router.post("/add-doctor", async (req, res) => {
  try {

    const doctor = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: "doctor",
      hospital: req.body.hospital
    });

    await doctor.save();

    res.json({
      message: "Doctor added successfully",
      doctor
    });

  } catch (error) {

    res.status(500).json({
      message: "Error adding doctor",
      error
    });

  }
});

// Get hospital beds
router.get("/beds", (req, res) => {

  const beds = {
    totalBeds: 100,
    availableBeds: 42
  };

  res.json(beds);

});

// Get all doctors
router.get("/doctors", async (req, res) => {
  try {

    const doctors = await User.find({ role: "doctor" });

    res.json(doctors);

  } catch (error) {

    res.status(500).json({
      message: "Error fetching doctors",
      error
    });

  }
});

module.exports = router;