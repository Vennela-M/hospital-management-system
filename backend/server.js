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
<<<<<<< HEAD
// 1. Import your files (Put these near the other 'require' lines at the top)
const userRoute = require("./routes/user");
const doctorRoute = require("./routes/doctor");

// 2. Connect the routes (Put these below 'const app = express()')
app.use("/api/users", userRoute);
app.use("/api/doctors", doctorRoute);
=======
app.use("/api/hospital", require("./routes/hospital"));
app.use("/api/admin", require("./routes/admin"));
>>>>>>> 9a15fefae1e0657daa0c2df7c1a7be821e5890f6

// Test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// Start server
app.listen(5001, () => {
  console.log("🚀 Server running on http://localhost:5001");
});