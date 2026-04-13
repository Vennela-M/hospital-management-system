const express = require("express");
const router = express.Router();
const Billing = require("../models/Billing");

// CREATE BILL
router.post("/", async (req, res) => {
  try {
    const bill = await Billing.create(req.body);
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: "Error creating bill" });
  }
});

module.exports = router;