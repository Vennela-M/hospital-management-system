const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const multer = require("multer");
const { auth, requireRole } = require("../middleware/auth");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

// 🔹 SIGNUP
router.post("/signup", async (req, res) => {
    try {
      const { name, email, password, role, phone, specialization, hospital } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      if (role === 'doctor') {
        return res.status(403).json({ message: "Doctor accounts must be created by an admin." });
      }

      // Generate unique Patient ID for patients/users
      let patientId = null;
      if (role === 'user' || !role) {
        const randomNum = Math.floor(Math.random() * 10000);
        patientId = `PA${randomNum.toString().padStart(4, '0')}`;
      }

      const userData = {
        name,
        email,
        password: hashedPassword,
        role: "user",
        phone,
        patientId
      };

      // Add doctor-specific fields if role is doctor
      if (role === 'doctor') {
        userData.specialization = specialization || '';
        userData.hospital = hospital || '';
      }

      const user = new User(userData);

      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });

      res.status(201).json({ 
        message: "Signup successful",
        user: { ...user._doc, password: undefined },
        token,
        patientId: patientId,
        doctorId: doctorId
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


// 🔹 ADMIN CREATE DOCTOR (Only admin can create doctors)
router.post("/admin/createDoctor", auth, requireRole(["admin"]), async (req, res) => {
    try {
      const { name, email, password, phone, specialization, hospital } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Doctor with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 10000);
      const doctorId = `DOC${timestamp}${randomNum}`;

      const doctorData = {
        name,
        email,
        password: hashedPassword,
        role: 'doctor',
        phone,
        doctorId,
        specialization: specialization || '',
        hospital: hospital || ''
      };

      const doctor = new User(doctorData);
      await doctor.save();

      res.status(201).json({ 
        message: "Doctor created successfully",
        doctor: { ...doctor._doc, password: undefined },
        doctorId
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


// 🔹 LOGIN
router.post("/login", async (req, res) => {
    const { contact, password } = req.body;
    if (!contact || !password) {
        return res.status(400).json({ message: "Contact (email or phone) and password are required" });
    }

    try {
        const user = await User.findOne({
            $or: [
                { email: contact },
                { phone: contact }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        if (user.role === 'user' && !user.patientId) {
            const randomNum = Math.floor(Math.random() * 10000);
            user.patientId = `PA${randomNum.toString().padStart(4, '0')}`;
            await user.save();
        }

        if (user.role === 'doctor' && !user.doctorId) {
            const timestamp = Date.now();
            const randomNum = Math.floor(Math.random() * 10000);
            user.doctorId = `DOC${timestamp}${randomNum}`;
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });

        const responseObj = {
            message: "Login successful",
            user: { ...user._doc, password: undefined },
            token
        };

        // Add doctorId if doctor, patientId if patient
        if (user.role === 'doctor' && user.doctorId) {
            responseObj.doctorId = user.doctorId;
        }
        if (user.role === 'user' && user.patientId) {
            responseObj.patientId = user.patientId;
        }

        res.json(responseObj);

    } catch (err) {
        res.status(500).json({ message: "Error in login" });
    }
});

// 🔹 ADMIN DOCTOR LOGIN
router.post("/admin/doctor-login", async (req, res) => {
    const { doctorId, password } = req.body;
    const adminToken = req.header("Authorization")?.replace("Bearer ", "");

    if (!doctorId || !password || !adminToken) {
        return res.status(400).json({ message: "Doctor id, password, and admin token are required" });
    }

    try {
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || "your-secret-key");
        const admin = await User.findById(decoded.id);

        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized: Only admins can login as doctors" });
        }

        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid doctor password" });
        }

        const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
        res.json({ message: "Doctor login successful", doctor: { ...doctor._doc, password: undefined }, token });
    } catch (err) {
        return res.status(403).json({ message: "Invalid admin token" });
    }
});


// 🔹 RESET PASSWORD
router.post("/reset", async (req, res) => {
    const { email, phone, newPassword } = req.body;
    if ((!email && !phone) || !newPassword) {
        return res.status(400).json({ message: "email or phone and newPassword are required" });
    }

    try {
        let user;

        if (email) {
            user = await User.findOne({ email });
        }

        if (!user && phone) {
            user = await User.findOne({ phone });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ message: "Error resetting password" });
    }
});

//UPDATE PROFILE

router.post("/updateProfile", auth, async (req, res) => {
    try {
      const updates = req.body;
      delete updates.password; // Prevent password update here
      delete updates.role; // Prevent role change

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true }
      );

      res.json({ message: "Profile updated successfully", user: { ...user._doc, password: undefined } });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating profile" });
    }
  });
// 🔹 GET CURRENT USER PROFILE
router.get("/me", auth, async (req, res) => {
    res.json({ user: { ...req.user._doc, password: undefined } });
});

router.post("/uploadReport", auth, upload.single("report"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "report file is required" });

        const user = req.user;

        if (!user.reports) user.reports = [];

        user.reports.push(req.file.filename);

        await user.save();

        res.status(201).json({ message: "Report uploaded", file: req.file.filename });

    } catch (err) {
        res.status(500).json({ message: "Upload error" });
    }
});
module.exports = router;
