/**
 * Links existing Doctor documents to their Hospital documents.
 * Run once after seeding:
 *   node src/scripts/linkDoctorsToHospitals.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
require('../models/user.model');
const Doctor   = require('../models/doctor.model');
const Hospital = require('../models/hospital.model');

const LINKS = [
  { doctorEmail: 'arjun.mehta@hospital.com',  hospitalName: 'AIG Hospitals' },
  { doctorEmail: 'priya.sharma@hospital.com', hospitalName: 'Yashoda Hospitals' },
  { doctorEmail: 'reddy.gp@hospital.com',     hospitalName: 'Apollo Hospitals' },
  { doctorEmail: 'sneha.rao@hospital.com',    hospitalName: 'KIMS Hospitals' },
  { doctorEmail: 'imran.khan@hospital.com',   hospitalName: 'Care Hospitals' },
  // Old seed doctors — assign to AIG as default
  { doctorEmail: 'rohan.verma@hospital.com',  hospitalName: 'AIG Hospitals' },
  { doctorEmail: 'sneha.patel@hospital.com',  hospitalName: 'KIMS Hospitals' },
  { doctorEmail: 'kiran.rao@hospital.com',    hospitalName: 'Yashoda Hospitals' },
];

const User = require('../models/user.model');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare')
  .then(async () => {
    let updated = 0;
    for (const link of LINKS) {
      const user     = await User.findOne({ email: link.doctorEmail });
      const hospital = await Hospital.findOne({ name: link.hospitalName });
      if (!user || !hospital) {
        console.log(`  SKIP  ${link.doctorEmail} — user or hospital not found`);
        continue;
      }
      const result = await Doctor.updateOne({ user: user._id }, { hospital: hospital._id });
      if (result.modifiedCount) {
        console.log(`  OK    ${link.doctorEmail} → ${link.hospitalName}`);
        updated++;
      } else {
        console.log(`  SKIP  ${link.doctorEmail} — already linked or not found`);
      }
    }
    console.log(`\nDone. Updated ${updated} doctors.`);
    await mongoose.disconnect();
  })
  .catch(err => { console.error(err.message); process.exit(1); });
