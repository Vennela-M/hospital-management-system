const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Appointment = require("../models/Appointment");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const addDoctor = async (req, res) => {
  const { name, email, specialization, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Doctor with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const doctorId = `DOC${timestamp}${randomNum}`;

  const doctor = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    specialization,
    role: "doctor",
    doctorId
  });

  res.status(201).json(doctor);
};

const updateDoctorAvailability = async (req, res) => {
  const { doctorId } = req.params;
  const { availability } = req.body;

  if (!isValidObjectId(doctorId)) {
    return res.status(400).json({ message: "Invalid doctor id" });
  }

  if (!availability || typeof availability !== "object") {
    return res.status(400).json({ message: "Availability object is required" });
  }

  const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  if (req.user.role !== "doctor" || req.user._id.toString() !== doctorId) {
    return res.status(403).json({ message: "Only the logged-in doctor can update availability" });
  }

  doctor.availability = availability;
  await doctor.save();

  res.json({ message: "Availability updated successfully", availability: doctor.availability });
};

const submitDoctorQuestion = async (req, res) => {
  const { doctorId } = req.params;
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: "Question text is required" });
  }

  if (!isValidObjectId(doctorId)) {
    return res.status(400).json({ message: "Invalid doctor id" });
  }

  const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const user = req.user;
  if (user.role !== "user") {
    return res.status(403).json({ message: "Only patients can send questions" });
  }

  doctor.questions.push({
    patient: user._id,
    question,
    status: "open"
  });

  await doctor.save();

  res.status(201).json({ message: "Question sent to doctor" });
};

const getDoctorMessages = async (req, res) => {
  const doctor = await User.findOne({ _id: req.user._id, role: "doctor" }).populate("questions.patient", "name email phone");
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  res.json({ questions: doctor.questions || [] });
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

  const appointments = await Appointment.find({ doctor: doctorId }).populate("patient", "name age email phone reports patientId");
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

  const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const filter = { doctor: doctorId };
  if (date) filter.date = date;

  const appointments = await Appointment.find(filter);
  const defaultSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM"];

  let availableSlots = defaultSlots;
  if (Array.isArray(doctor.availability) && doctor.availability.length > 0) {
    availableSlots = doctor.availability;
  } else if (doctor.availability && typeof doctor.availability === "object" && date) {
    const requestedDate = new Date(date);
    if (!Number.isNaN(requestedDate.getTime())) {
      const dayName = requestedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      availableSlots = doctor.availability[dayName] || defaultSlots;
    }
  }

  const bookedSlots = appointments.map((a) => a.time);
  const freeSlots = availableSlots.filter((s) => !bookedSlots.includes(s));

  res.json({ bookedSlots, freeSlots, date: date || null, availability: availableSlots });
};

module.exports = {
  addDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  getDoctorAvailability,
  updateDoctorAvailability,
  submitDoctorQuestion,
  getDoctorMessages
};
