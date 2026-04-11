const express = require("express");
const router = express.Router();
const User = require("../models/User");


// Get all system data
router.get("/all-data", async (req, res) => {

  try {

    const users = await User.find();

    const doctors = await User.find({ role: "doctor" });

    const patients = await User.find({ role: "user" });

    const hospitals = await User.find({ role: "hospital" });

    res.json({
      totalUsers: users.length,
      totalDoctors: doctors.length,
      totalPatients: patients.length,
      totalHospitals: hospitals.length,
      users
    });

  } catch (error) {

    res.status(500).json({
      message: "Error fetching data",
      error
    });

  }

});
// Delete a user/doctor by id
router.delete("/user/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
}); 
module.exports = router;