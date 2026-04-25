const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    report: {
      type: String, // free-text description
      trim: true,
      default: '',
    },
    fileUrl: {
      type: String, // external URL (optional)
      trim: true,
    },
    // Base64-encoded file for local storage (PDF / image)
    fileData: {
      type: String,   // base64 string
      default: null,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,   // MIME type e.g. "application/pdf", "image/jpeg"
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Report date is required'],
      default: Date.now,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
