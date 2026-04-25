const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other'];

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true, // one profile per user
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age seems invalid'],
    },
    gender: {
      type: String,
      enum: { values: GENDERS, message: `Gender must be one of: ${GENDERS.join(', ')}` },
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-().]{7,20}$/, 'Please provide a valid phone number'],
    },
    height: {
      type: Number, // in cm
      min: [0, 'Height cannot be negative'],
    },
    weight: {
      type: Number, // in kg
      min: [0, 'Weight cannot be negative'],
    },
    bloodGroup: {
      type: String,
      enum: { values: BLOOD_GROUPS, message: `Blood group must be one of: ${BLOOD_GROUPS.join(', ')}` },
      uppercase: true,
    },
    allergies: {
      type: [String],
      default: [],
    },
    chronicDiseases: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Patient', patientSchema);
