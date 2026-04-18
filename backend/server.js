const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(bodyParser.json());

// ✅ ROUTES (CLEAN STRUCTURE)
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/doctors", require("./routes/doctor"));
app.use("/api/users", require("./routes/user"));

app.use("/api/billing", require("./routes/billingRoutes"));
app.use("/api/beds", require("./routes/bedRoutes"));

app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/hospital", require("./routes/hospitalRoutes"));
const userRoute = require("./routes/user");

// ✅ FILE UPLOAD ACCESS
app.use("/uploads", express.static("uploads"));

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use(notFound);
app.use(errorHandler);

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});