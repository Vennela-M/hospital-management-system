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
app.use("/api/hospital", require("./routes/hospital"));
app.use("/api/admin", require("./routes/admin"));

// New routes from teammate
const userRoute = require("./routes/user");
const doctorRoute = require("./routes/doctor");

app.use("/api/users", userRoute);
app.use("/api/doctors", doctorRoute);

// Test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// Start server
app.listen(5001, () => {
  console.log("🚀 Server running on http://localhost:5001");
});