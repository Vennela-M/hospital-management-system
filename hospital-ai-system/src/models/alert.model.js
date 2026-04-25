const mongoose = require('mongoose');

// Expanded types: original system types + admin-facing types
const ALERT_TYPES   = ['critical', 'reminder', 'outbreak', 'info', 'warning', 'emergency'];
const ALERT_STATUSES = ['unread', 'read'];

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: { values: ALERT_TYPES, message: `Type must be one of: ${ALERT_TYPES.join(', ')}` },
      required: [true, 'Alert type is required'],
    },
    status: {
      type: String,
      enum: { values: ALERT_STATUSES, message: `Status must be one of: ${ALERT_STATUSES.join(', ')}` },
      default: 'unread',
    },
    // Who sent this alert (admin user _id)
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Alert', alertSchema);
