require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { init: initSocket } = require('./utils/socket');
const { startMissedAppointmentJob } = require('./jobs/alert.cron');

const PORT = process.env.PORT || 5000;

// Wrap Express in a plain HTTP server so Socket.io can share the same port
const httpServer = http.createServer(app);

// Initialise Socket.io
initSocket(httpServer);

// Connect to DB, then start listening
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Start scheduled jobs after DB is ready
    startMissedAppointmentJob();
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
