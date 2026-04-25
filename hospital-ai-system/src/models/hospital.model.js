const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    head: {
      type: String,
      trim: true,
    },
    doctorCount: {
      type: Number,
      default: 0,
    },
    bedCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false, minimize: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    totalBeds: {
      type: Number,
      default: 0,
      min: [0, 'Total beds cannot be negative'],
    },
    availableBeds: {
      type: Number,
      default: 0,
      min: [0, 'Available beds cannot be negative'],
    },
    departments: {
      type: [departmentSchema],
      default: [],
    },
    // Doctors assigned to this hospital (references Doctor profile docs)
    doctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hospital', hospitalSchema);
