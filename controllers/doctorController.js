const mongoose = require("mongoose");
const User = require("../models/User");
const Appointment = require("../models/Appointment");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const addDoctor = async (req, res) => {
  const { name, email, specialization, phone, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "name and email are required" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Doctor with this email already exists" });
  }

  const doctor = await User.create({
    name,
    email,
    phone,
    password,
    specialization,
    role: "doctor"
  });

  res.status(201).json(doctor);
};

const getDoctors = async (_req, res) => {
  const doctors = await User.find({ role: "doctor" }).sort({ createdAt: -1 });
  res.json(doctors);
};

const getDoctorById = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid doctor id" });
  }

  const doctor = await User.findOne({ _id: id, role: "doctor" });
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  res.json(doctor);
};

const updateDoctor = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid doctor id" });
  }

  const updates = req.body;
  delete updates.role;

  const updated = await User.findOneAndUpdate(
    { _id: id, role: "doctor" },
    updates,
    { new: true, runValidators: true }
  );

  if (!updated) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  res.json(updated);
};

const deleteDoctor = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid doctor id" });
  }

  const deleted = await User.findOneAndDelete({ _id: id, role: "doctor" });
  if (!deleted) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  await Appointment.deleteMany({ doctor: id });
  res.json({ message: "Doctor deleted successfully" });
};

const getDoctorPatients = async (req, res) => {
  const { doctorId } = req.params;
  if (!isValidObjectId(doctorId)) {
    return res.status(400).json({ message: "Invalid doctor id" });
  }

  const appointments = await Appointment.find({ doctor: doctorId }).populate("patient");
  const uniqueMap = new Map();

  appointments.forEach((a) => {
    if (a.patient?._id) {
      uniqueMap.set(String(a.patient._id), a.patient);
    }
  });

  res.json(Array.from(uniqueMap.values()));
};

const getDoctorAvailability = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!isValidObjectId(doctorId)) {
    return res.status(400).json({ message: "Invalid doctor id" });
  }

  const filter = { doctor: doctorId };
  if (date) filter.date = date;

  const appointments = await Appointment.find(filter);
  const allSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM"];
  const bookedSlots = appointments.map((a) => a.time);
  const freeSlots = allSlots.filter((s) => !bookedSlots.includes(s));

  res.json({ bookedSlots, freeSlots, date: date || null });
};

module.exports = {
  addDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  getDoctorAvailability
};
