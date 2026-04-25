/**
 * Master seed script — inserts hospitals, doctors, patients, and appointments.
 *
 * Run from hospital-ai-system/:
 *   node src/scripts/seedAll.js
 *
 * Idempotent — skips records that already exist by email / name.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User        = require('../models/user.model');
const Doctor      = require('../models/doctor.model');
const Hospital    = require('../models/hospital.model');
const Patient     = require('../models/patient.model');
const Appointment = require('../models/appointment.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare';

// ─── Default Mon-Sat 10:00-17:00 availability ────────────────────────────────
const DEFAULT_AVAILABILITY = [
  { day: 'monday',    startTime: '10:00', endTime: '17:00' },
  { day: 'tuesday',   startTime: '10:00', endTime: '17:00' },
  { day: 'wednesday', startTime: '10:00', endTime: '17:00' },
  { day: 'thursday',  startTime: '10:00', endTime: '17:00' },
  { day: 'friday',    startTime: '10:00', endTime: '17:00' },
  { day: 'saturday',  startTime: '10:00', endTime: '14:00' },
];

// ─── Hospital definitions ─────────────────────────────────────────────────────
const HOSPITALS = [
  {
    name: 'AIG Hospitals',
    address: 'Survey No 1, Mindspace Rd, Gachibowli, Hyderabad, Telangana 500032',
    phone: '+91-40-4244-4222',
    email: 'info@aighosp.in',
    website: 'https://www.aighosp.in',
    description: 'Asian Institute of Gastroenterology — a leading multi-specialty hospital.',
    totalBeds: 400,
    availableBeds: 120,
    departments: [
      { name: 'Cardiology',        head: 'Dr. Arjun Mehta' },
      { name: 'Gastroenterology',  head: 'Dr. Ravi Kumar' },
      { name: 'General Surgery',   head: 'Dr. Suresh Babu' },
      { name: 'Neurology',         head: 'Dr. Priya Nair' },
      { name: 'Orthopedics',       head: 'Dr. Imran Khan' },
    ],
  },
  {
    name: 'Yashoda Hospitals',
    address: 'Raj Bhavan Rd, Somajiguda, Hyderabad, Telangana 500082',
    phone: '+91-40-4567-4567',
    email: 'info@yashodahospitals.com',
    website: 'https://www.yashodahospitals.com',
    description: 'Multi-specialty hospital known for advanced cardiac and neuro care.',
    totalBeds: 350,
    availableBeds: 90,
    departments: [
      { name: 'Dermatology',       head: 'Dr. Priya Sharma' },
      { name: 'Cardiology',        head: 'Dr. Venkat Rao' },
      { name: 'Oncology',          head: 'Dr. Meena Reddy' },
      { name: 'Pediatrics',        head: 'Dr. Anita Singh' },
      { name: 'General Medicine',  head: 'Dr. Sanjay Gupta' },
    ],
  },
  {
    name: 'Apollo Hospitals',
    address: 'Jubilee Hills, Hyderabad, Telangana 500033',
    phone: '+91-40-2360-7777',
    email: 'hyderabad@apollohospitals.com',
    website: 'https://www.apollohospitals.com',
    description: 'Part of the Apollo Hospitals Group — India\'s largest healthcare chain.',
    totalBeds: 500,
    availableBeds: 150,
    departments: [
      { name: 'General Medicine',  head: 'Dr. Reddy' },
      { name: 'Cardiology',        head: 'Dr. Anil Sharma' },
      { name: 'Neurology',         head: 'Dr. Kavitha Rao' },
      { name: 'Orthopedics',       head: 'Dr. Suresh Nair' },
      { name: 'Gynecology',        head: 'Dr. Lakshmi Devi' },
    ],
  },
  {
    name: 'KIMS Hospitals',
    address: '1-8-31/1, Minister Rd, Secunderabad, Telangana 500003',
    phone: '+91-40-4488-5000',
    email: 'info@kimshospitals.com',
    website: 'https://www.kimshospitals.com',
    description: 'Krishna Institute of Medical Sciences — tertiary care hospital.',
    totalBeds: 450,
    availableBeds: 100,
    departments: [
      { name: 'Pediatrics',        head: 'Dr. Sneha Rao' },
      { name: 'Neonatology',       head: 'Dr. Ramesh Kumar' },
      { name: 'Cardiology',        head: 'Dr. Vijay Reddy' },
      { name: 'Nephrology',        head: 'Dr. Srinivas Rao' },
      { name: 'Pulmonology',       head: 'Dr. Anand Babu' },
    ],
  },
  {
    name: 'Care Hospitals',
    address: 'Road No 1, Banjara Hills, Hyderabad, Telangana 500034',
    phone: '+91-40-3041-8888',
    email: 'info@carehospitals.com',
    website: 'https://www.carehospitals.com',
    description: 'Care Hospitals — comprehensive multi-specialty care.',
    totalBeds: 300,
    availableBeds: 80,
    departments: [
      { name: 'Orthopedics',       head: 'Dr. Imran Khan' },
      { name: 'Spine Surgery',     head: 'Dr. Ravi Shankar' },
      { name: 'Rheumatology',      head: 'Dr. Preethi Nair' },
      { name: 'General Medicine',  head: 'Dr. Suresh Babu' },
      { name: 'Emergency',         head: 'Dr. Arun Kumar' },
    ],
  },
];

// ─── Doctor definitions ───────────────────────────────────────────────────────
const DOCTORS = [
  {
    user: {
      name: 'Dr. Arjun Mehta',
      email: 'arjun.mehta@hospital.com',
      password: 'Doctor@1234',
      role: 'doctor',
    },
    profile: {
      name: 'Dr. Arjun Mehta',
      specialization: 'Cardiology',
      experience: 12,
      availability: DEFAULT_AVAILABILITY,
    },
    hospitalName: 'AIG Hospitals',
  },
  {
    user: {
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@hospital.com',
      password: 'Doctor@1234',
      role: 'doctor',
    },
    profile: {
      name: 'Dr. Priya Sharma',
      specialization: 'Dermatology',
      experience: 9,
      availability: DEFAULT_AVAILABILITY,
    },
    hospitalName: 'Yashoda Hospitals',
  },
  {
    user: {
      name: 'Dr. Reddy',
      email: 'reddy.gp@hospital.com',
      password: 'Doctor@1234',
      role: 'doctor',
    },
    profile: {
      name: 'Dr. Reddy',
      specialization: 'General Physician',
      experience: 15,
      availability: DEFAULT_AVAILABILITY,
    },
    hospitalName: 'Apollo Hospitals',
  },
  {
    user: {
      name: 'Dr. Sneha Rao',
      email: 'sneha.rao@hospital.com',
      password: 'Doctor@1234',
      role: 'doctor',
    },
    profile: {
      name: 'Dr. Sneha Rao',
      specialization: 'Pediatrics',
      experience: 7,
      availability: DEFAULT_AVAILABILITY,
    },
    hospitalName: 'KIMS Hospitals',
  },
  {
    user: {
      name: 'Dr. Imran Khan',
      email: 'imran.khan@hospital.com',
      password: 'Doctor@1234',
      role: 'doctor',
    },
    profile: {
      name: 'Dr. Imran Khan',
      specialization: 'Orthopedics',
      experience: 11,
      availability: DEFAULT_AVAILABILITY,
    },
    hospitalName: 'Care Hospitals',
  },
];

// ─── Patient definitions ──────────────────────────────────────────────────────
const PATIENTS = [
  {
    user: { name: 'Rahul Verma',   email: 'rahul.verma@gmail.com',   password: 'Patient@1234', role: 'patient' },
    profile: { age: 34, gender: 'male',   phone: '+91-9876543210', bloodGroup: 'B+', allergies: ['Penicillin'], chronicDiseases: ['Hypertension'] },
  },
  {
    user: { name: 'Ananya Singh',  email: 'ananya.singh@gmail.com',  password: 'Patient@1234', role: 'patient' },
    profile: { age: 28, gender: 'female', phone: '+91-9876543211', bloodGroup: 'A+', allergies: [], chronicDiseases: [] },
  },
  {
    user: { name: 'Kiran Patel',   email: 'kiran.patel@gmail.com',   password: 'Patient@1234', role: 'patient' },
    profile: { age: 45, gender: 'male',   phone: '+91-9876543212', bloodGroup: 'O+', allergies: ['Sulfa'], chronicDiseases: ['Diabetes'] },
  },
  {
    user: { name: 'Meera Nair',    email: 'meera.nair@gmail.com',    password: 'Patient@1234', role: 'patient' },
    profile: { age: 31, gender: 'female', phone: '+91-9876543213', bloodGroup: 'AB+', allergies: [], chronicDiseases: [] },
  },
  {
    user: { name: 'Suresh Babu',   email: 'suresh.babu@gmail.com',   password: 'Patient@1234', role: 'patient' },
    profile: { age: 52, gender: 'male',   phone: '+91-9876543214', bloodGroup: 'O-', allergies: ['Aspirin'], chronicDiseases: ['Arthritis', 'Hypertension'] },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(n)   { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysAhead(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log(`\nConnected to MongoDB: ${MONGO_URI}\n`);

  // ── 1. Hospitals ────────────────────────────────────────────────────────────
  console.log('── Hospitals ──────────────────────────────────────');
  const hospitalMap = {}; // name → Hospital doc

  for (const h of HOSPITALS) {
    let hosp = await Hospital.findOne({ name: h.name });
    if (hosp) {
      console.log(`  SKIP  ${h.name}`);
    } else {
      hosp = await Hospital.create(h);
      console.log(`  OK    ${h.name}`);
    }
    hospitalMap[h.name] = hosp;
  }

  // ── 2. Doctors ──────────────────────────────────────────────────────────────
  console.log('\n── Doctors ────────────────────────────────────────');
  const doctorUserMap = {}; // email → { user, doctor }

  for (const entry of DOCTORS) {
    let user = await User.findOne({ email: entry.user.email });
    let doctor;

    if (user) {
      doctor = await Doctor.findOne({ user: user._id });
      if (!doctor) {
        doctor = await Doctor.create({ ...entry.profile, user: user._id });
      } else {
        // Update availability if empty
        if (!doctor.availability || doctor.availability.length === 0) {
          doctor.availability = DEFAULT_AVAILABILITY;
          await doctor.save();
        }
      }
      console.log(`  SKIP  ${entry.user.email} (user exists)`);
    } else {
      user   = await User.create(entry.user);
      doctor = await Doctor.create({ ...entry.profile, user: user._id });
      console.log(`  OK    ${entry.user.email} — ${entry.profile.specialization}`);
    }

    doctorUserMap[entry.user.email] = { user, doctor };

    // Link doctor to hospital
    const hosp = hospitalMap[entry.hospitalName];
    if (hosp && !hosp.doctors.map(String).includes(String(doctor._id))) {
      hosp.doctors.push(doctor._id);
      await hosp.save();
    }
  }

  // ── 3. Patients ─────────────────────────────────────────────────────────────
  console.log('\n── Patients ───────────────────────────────────────');
  const patientUsers = [];

  for (const entry of PATIENTS) {
    let user = await User.findOne({ email: entry.user.email });
    if (user) {
      console.log(`  SKIP  ${entry.user.email}`);
    } else {
      user = await User.create(entry.user);
      // Create patient profile
      await Patient.create({ ...entry.profile, user: user._id });
      console.log(`  OK    ${entry.user.email}`);
    }
    patientUsers.push(user);
  }

  // ── 4. Appointments ─────────────────────────────────────────────────────────
  console.log('\n── Appointments ───────────────────────────────────');

  // Get doctor User IDs (appointments reference User, not Doctor)
  const doctorEntries = Object.values(doctorUserMap);

  const APPOINTMENTS = [
    // Past completed
    { patient: patientUsers[0], doctor: doctorEntries[0].user, date: daysAgo(10), time: '10:00', status: 'completed', notes: 'Routine cardiac checkup' },
    { patient: patientUsers[1], doctor: doctorEntries[1].user, date: daysAgo(7),  time: '11:00', status: 'completed', notes: 'Skin allergy consultation' },
    { patient: patientUsers[2], doctor: doctorEntries[2].user, date: daysAgo(5),  time: '14:00', status: 'completed', notes: 'General health checkup' },
    // Past cancelled
    { patient: patientUsers[3], doctor: doctorEntries[3].user, date: daysAgo(3),  time: '10:30', status: 'cancelled', notes: 'Patient cancelled' },
    // Pending (upcoming)
    { patient: patientUsers[0], doctor: doctorEntries[1].user, date: daysAhead(2), time: '10:00', status: 'pending',   notes: 'Follow-up dermatology' },
    { patient: patientUsers[1], doctor: doctorEntries[2].user, date: daysAhead(3), time: '11:30', status: 'pending',   notes: 'Fever and cold' },
    { patient: patientUsers[2], doctor: doctorEntries[4].user, date: daysAhead(5), time: '13:00', status: 'pending',   notes: 'Knee pain consultation' },
    // Confirmed
    { patient: patientUsers[3], doctor: doctorEntries[0].user, date: daysAhead(7), time: '10:30', status: 'confirmed', notes: 'ECG and stress test' },
    { patient: patientUsers[4], doctor: doctorEntries[3].user, date: daysAhead(4), time: '12:00', status: 'confirmed', notes: 'Child vaccination' },
  ];

  let apptCreated = 0;
  let apptSkipped = 0;

  for (const appt of APPOINTMENTS) {
    // Normalise date to midnight UTC to match the unique index
    const dateOnly = new Date(appt.date);
    dateOnly.setHours(0, 0, 0, 0);

    const exists = await Appointment.findOne({
      doctor: appt.doctor._id,
      date:   dateOnly,
      time:   appt.time,
      status: { $ne: 'cancelled' },
    });

    if (exists) {
      apptSkipped++;
      continue;
    }

    await Appointment.create({
      patient: appt.patient._id,
      doctor:  appt.doctor._id,
      date:    dateOnly,
      time:    appt.time,
      status:  appt.status,
      notes:   appt.notes,
    });
    apptCreated++;
  }

  console.log(`  Created: ${apptCreated}  Skipped: ${apptSkipped}`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n── Done ───────────────────────────────────────────');
  console.log('Doctor login password: Doctor@1234');
  console.log('Patient login password: Patient@1234');
  console.log('Admin: admin@hospital.com / Admin@1234');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
