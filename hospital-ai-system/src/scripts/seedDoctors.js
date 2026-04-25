/**
 * Seed script — inserts 5 dummy doctors into MongoDB.
 *
 * Each doctor needs:
 *   1. A User document with role = "doctor"
 *   2. A Doctor profile document linked to that user
 *
 * Run from the hospital-ai-system directory:
 *   node src/scripts/seedDoctors.js
 *
 * Safe to re-run — skips any email that already exists.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare';

const DUMMY_DOCTORS = [
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
      availability: [
        { day: 'monday',    startTime: '09:00', endTime: '17:00' },
        { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
        { day: 'friday',    startTime: '09:00', endTime: '13:00' },
      ],
    },
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
      specialization: 'Neurology',
      experience: 9,
      availability: [
        { day: 'tuesday',  startTime: '10:00', endTime: '18:00' },
        { day: 'thursday', startTime: '10:00', endTime: '18:00' },
        { day: 'saturday', startTime: '09:00', endTime: '13:00' },
      ],
    },
  },
  {
    user: {
      name: 'Dr. Rohan Verma',
      email: 'rohan.verma@hospital.com',
      password: 'Doctor@1234',
      role: 'doctor',
    },
    profile: {
      name: 'Dr. Rohan Verma',
      specialization: 'Orthopedics',
      experience: 15,
      availability: [
        { day: 'monday',    startTime: '08:00', endTime: '16:00' },
        { day: 'tuesday',   startTime: '08:00', endTime: '16:00' },
        { day: 'wednesday', startTime: '08:00', endTime: '16:00' },
        { day: 'thursday',  startTime: '08:00', endTime: '16:00' },
        { day: 'friday',    startTime: '08:00', endTime: '12:00' },
      ],
    },
  },
  {
    user: {
      name: 'Dr. Sneha Patel',
      email: 'sneha.patel@hospital.com',
      password: 'Doctor@1234',
      role: 'doctor',
    },
    profile: {
      name: 'Dr. Sneha Patel',
      specialization: 'Pediatrics',
      experience: 7,
      availability: [
        { day: 'monday',   startTime: '09:00', endTime: '15:00' },
        { day: 'thursday', startTime: '09:00', endTime: '15:00' },
        { day: 'friday',   startTime: '09:00', endTime: '15:00' },
      ],
    },
  },
  {
    user: {
      name: 'Dr. Kiran Rao',
      email: 'kiran.rao@hospital.com',
      password: 'Doctor@1234',
      role: 'doctor',
    },
    profile: {
      name: 'Dr. Kiran Rao',
      specialization: 'Dermatology',
      experience: 10,
      availability: [
        { day: 'tuesday',  startTime: '11:00', endTime: '19:00' },
        { day: 'wednesday', startTime: '11:00', endTime: '19:00' },
        { day: 'saturday', startTime: '10:00', endTime: '14:00' },
      ],
    },
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB: ${MONGO_URI}`);

  let created = 0;
  let skipped = 0;

  for (const entry of DUMMY_DOCTORS) {
    // Check if user already exists
    const existing = await User.findOne({ email: entry.user.email });
    if (existing) {
      console.log(`  SKIP  ${entry.user.email} — user already exists`);
      skipped++;
      continue;
    }

    // Create the User (password is hashed by the pre-save hook)
    const user = await User.create(entry.user);

    // Create the Doctor profile linked to the user
    await Doctor.create({ ...entry.profile, user: user._id });

    console.log(`  OK    ${entry.user.email} — ${entry.profile.specialization}, ${entry.profile.experience} yrs`);
    created++;
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
