/**
 * Creates empty Patient profile documents for any patient User
 * that doesn't already have one.
 *
 * Run once:
 *   node src/scripts/backfillPatientProfiles.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User    = require('../models/user.model');
const Patient = require('../models/patient.model');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare')
  .then(async () => {
    const patients = await User.find({ role: 'patient' });
    let created = 0, skipped = 0;

    for (const u of patients) {
      const exists = await Patient.findOne({ user: u._id });
      if (exists) { skipped++; continue; }
      await Patient.create({ user: u._id });
      console.log(`  Created profile for: ${u.email}`);
      created++;
    }

    console.log(`\nDone. Created: ${created}  Skipped: ${skipped}`);
    await mongoose.disconnect();
  })
  .catch(err => { console.error(err.message); process.exit(1); });
