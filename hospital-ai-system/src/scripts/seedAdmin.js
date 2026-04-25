/**
 * Seed script — creates a default admin account.
 *
 * Run from the hospital-ai-system directory:
 *   node src/scripts/seedAdmin.js
 *
 * Safe to re-run — skips if admin already exists.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB: ${MONGO_URI}`);

  const existing = await User.findOne({ email: 'admin@hospital.com' });
  if (existing) {
    console.log('Admin already exists — skipping.');
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: 'System Admin',
    email: 'admin@hospital.com',
    password: 'Admin@1234',
    role: 'admin',
  });

  console.log('Admin created:');
  console.log('  Email:    admin@hospital.com');
  console.log('  Password: Admin@1234');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
