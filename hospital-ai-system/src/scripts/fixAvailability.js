require('dotenv').config();
const mongoose = require('mongoose');
require('../models/user.model');
const Doctor = require('../models/doctor.model');

const AVAIL = [
  { day: 'monday',    startTime: '10:00', endTime: '17:00' },
  { day: 'tuesday',   startTime: '10:00', endTime: '17:00' },
  { day: 'wednesday', startTime: '10:00', endTime: '17:00' },
  { day: 'thursday',  startTime: '10:00', endTime: '17:00' },
  { day: 'friday',    startTime: '10:00', endTime: '17:00' },
  { day: 'saturday',  startTime: '10:00', endTime: '14:00' },
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare').then(async () => {
  // Update any doctor that has fewer than 6 availability slots
  const doctors = await Doctor.find();
  let updated = 0;
  for (const doc of doctors) {
    if (!doc.availability || doc.availability.length < 6) {
      doc.availability = AVAIL;
      await doc.save();
      updated++;
      console.log(`  Updated: ${doc.name}`);
    }
  }
  console.log(`Done. Updated ${updated} doctors.`);
  await mongoose.disconnect();
}).catch(err => { console.error(err.message); process.exit(1); });
