const express = require("express");
const router = express.Router();

let appointments = []; // temporary (later DB)

router.post("/book", (req, res) => {
    const { name, hospital, doctor, date } = req.body;

const appointment = { name, hospital, doctor, date };
    appointments.push(appointment);

    res.json({ message: "Appointment booked", appointment });
});

router.get("/all", (req, res) => {
    res.json(appointments);
});

module.exports = router;