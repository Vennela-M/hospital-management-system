const express = require("express");
const router = express.Router();
const Billing = require("../models/Billing");
const mongoose = require("mongoose");
const { auth, requireRole } = require("../middleware/auth");

// CREATE BILL
router.post("/", auth, requireRole(["admin", "doctor"]), async (req, res) => {
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

// GET ALL BILLS
router.get("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const bills = await Billing.find().populate("patient", "name email");
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE BILL STATUS
router.put("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Billing.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;