const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;

// 🔹 CREATE ADMIN USER AND SEED HOSPITALS
const createAdminUser = async () => {
  try {
    const adminEmail = "team14admin";
    const adminPassword = "Team14@mlrit";
    const adminName = "System Administrator";

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        phone: "0000000000"
      });
      await adminUser.save();
      console.log("✅ Admin user created: team14admin / Team14@mlrit");
    } else {
      console.log("✅ Admin user already exists");
    }

    // Seed hospitals with real data
    const Hospital = require("./models/Hospital");
    
    // Define all hospitals to ensure exist
    const hospitalsToSeed = [
      {
        name: "Apollo Hospital",
        address: "123 Main Street, Hyderabad, Telangana 500001",
        phone: "+91 40 2360 1000",
        email: "info@apollohospital.com",
        totalBeds: 250,
        availableBeds: 180,
        latitude: 17.3850,
        longitude: 78.4867,
        departments: [
          { name: "Cardiology", doctorsCount: 15, bedsCount: 45, status: "active" },
          { name: "Neurology", doctorsCount: 10, bedsCount: 35, status: "active" },
          { name: "Emergency", doctorsCount: 20, bedsCount: 50, status: "active" },
          { name: "Orthopedics", doctorsCount: 12, bedsCount: 40, status: "active" }
        ],
        description: "Leading multi-specialty hospital with advanced facilities",
        website: "www.apollohospital.com"
      },
      {
        name: "KIMS Hospital",
        address: "8-2-596/5, Osman Nagar, Hyderabad, Telangana 500062",
        phone: "+91 40 2456 7000",
        email: "admin@kimshospital.com",
        totalBeds: 200,
        availableBeds: 145,
        latitude: 17.3750,
        longitude: 78.5000,
        departments: [
          { name: "Cardiology", doctorsCount: 12, bedsCount: 35, status: "active" },
          { name: "General Surgery", doctorsCount: 14, bedsCount: 40, status: "active" },
          { name: "Pediatrics", doctorsCount: 8, bedsCount: 25, status: "active" },
          { name: "Oncology", doctorsCount: 10, bedsCount: 30, status: "active" }
        ],
        description: "Multi-specialty hospital with comprehensive healthcare services",
        website: "www.kimshospital.com"
      },
      {
        name: "Yashoda Hospital",
        address: "Opp. Padma Rao Nagar, Somajiguda, Hyderabad, Telangana 500082",
        phone: "+91 40 6723 5000",
        email: "contact@yashodahospital.com",
        totalBeds: 180,
        availableBeds: 120,
        latitude: 17.3900,
        longitude: 78.4650,
        departments: [
          { name: "Ophthalmology", doctorsCount: 8, bedsCount: 20, status: "active" },
          { name: "ENT", doctorsCount: 6, bedsCount: 15, status: "active" },
          { name: "Dermatology", doctorsCount: 7, bedsCount: 12, status: "active" },
          { name: "Gastroenterology", doctorsCount: 9, bedsCount: 25, status: "active" }
        ],
        description: "Specialized hospital focusing on multiple medical specialties",
        website: "www.yashodahospital.com"
      },
      {
        name: "Care Hospital",
        address: "Rd. no. 10, HITEC City, Hyderabad, Telangana 500081",
        phone: "+91 40 4440 5000",
        email: "care@carehospital.com",
        totalBeds: 220,
        availableBeds: 160,
        latitude: 17.3600,
        longitude: 78.5500,
        departments: [
          { name: "Urology", doctorsCount: 7, bedsCount: 18, status: "active" },
          { name: "Nephrology", doctorsCount: 5, bedsCount: 12, status: "active" },
          { name: "Orthopedics", doctorsCount: 11, bedsCount: 35, status: "active" },
          { name: "Radiology", doctorsCount: 8, bedsCount: 20, status: "active" }
        ],
        description: "Advanced care hospital with state-of-the-art facilities",
        website: "www.carehospital.com"
      },
      {
        name: "Fortis Hospital",
        address: "4-1-868, Somajiguda, Hyderabad, Telangana 500082",
        phone: "+91 40 4866 5000",
        email: "info@fortishospital.com",
        totalBeds: 280,
        availableBeds: 200,
        latitude: 17.3850,
        longitude: 78.4600,
        departments: [
          { name: "Cardiology", doctorsCount: 18, bedsCount: 50, status: "active" },
          { name: "Neurology", doctorsCount: 12, bedsCount: 40, status: "active" },
          { name: "Oncology", doctorsCount: 15, bedsCount: 45, status: "active" },
          { name: "General Surgery", doctorsCount: 16, bedsCount: 48, status: "active" }
        ],
        description: "Premium multi-specialty hospital with comprehensive medical services",
        website: "www.fortishospital.com"
      }
    ];

    // Ensure each hospital exists, create if not
    let addedCount = 0;
    for (const hospitalData of hospitalsToSeed) {
      const exists = await Hospital.findOne({ name: hospitalData.name });
      if (!exists) {
        await Hospital.create(hospitalData);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      console.log(`✅ Added ${addedCount} new hospitals`);
    } else {
      console.log(`✅ All 5 hospitals already seeded`);
    }
  } catch (error) {
    console.error("❌ Error creating admin user or hospitals:", error);
  }
};

connectDB().then(() => {
  createAdminUser();
});

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