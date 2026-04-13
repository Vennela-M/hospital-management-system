const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use(bodyParser.json());

// ✅ ROUTES (CLEAN STRUCTURE)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/doctors", require("./routes/doctor"));
app.use("/api/users", require("./routes/user"));

// ✅ FILE UPLOAD ACCESS
app.use("/uploads", express.static("uploads"));

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("API Running...");
});

// ✅ START SERVER
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});