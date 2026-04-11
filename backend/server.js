const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const connectDB = require("./config/db");

const app = express();

// Connect Database
connectDB();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
// 1. Import your files (Put these near the other 'require' lines at the top)
const userRoute = require("./routes/user");
const doctorRoute = require("./routes/doctor");

// 2. Connect the routes (Put these below 'const app = express()')
app.use("/api/users", userRoute);
app.use("/api/doctors", doctorRoute);

// Test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});