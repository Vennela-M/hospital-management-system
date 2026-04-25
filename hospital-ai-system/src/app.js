const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const alertRoutes = require('./routes/alert.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const medicalReportRoutes = require('./routes/medicalReport.routes');
const adminRoutes = require('./routes/admin.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// CORS – allow requests from the frontend served on any localhost port
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, Postman, mobile apps)
    // and any localhost / 127.0.0.1 origin
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patient', patientRoutes);   // singular  – matches requirement
app.use('/api/patients', patientRoutes);  // plural    – kept for compatibility
app.use('/api/doctor', doctorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-reports', medicalReportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hospital', hospitalRoutes); // alias used by admin.html frontend

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
