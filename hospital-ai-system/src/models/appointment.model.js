const mongoose = require('mongoose');

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    time: {
      type: String,
      required: [true, 'Appointment time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM (24-hour) format'],
    },
    status: {
      type: String,
      enum: {
        values: APPOINTMENT_STATUSES,
        message: `Status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`,
      },
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    missedAlertSent: {
      type: Boolean,
      default: false,
      select: false, // hide from normal query results
    },
  },
  {
    timestamps: true,
  }
);

// Prevent double-booking the same doctor at the same date+time
appointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['cancelled'] } },
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
