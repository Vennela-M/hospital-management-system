const express = require("express");
const router = express.Router();
const Billing = require("../models/Billing");
const mongoose = require("mongoose");

// CREATE BILL
router.post("/", async (req, res) => {
  try {
    const { patient, amount } = req.body;
    if (!patient || !mongoose.Types.ObjectId.isValid(patient)) {
      return res.status(400).json({ message: "Valid patient id is required" });
    }
    if (amount === undefined || Number(amount) < 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const bill = await Billing.create(req.body);
    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message || "Error creating bill" });
  }
});

module.exports = router;