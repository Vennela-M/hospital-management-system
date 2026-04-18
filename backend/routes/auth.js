const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const multer = require("multer");
const { auth } = require("../middleware/auth");

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

      const userData = {
        name,
        email,
        password: hashedPassword,
        role: role || "user",
        phone
      };

      // Add doctor-specific fields if role is doctor
      if (role === 'doctor') {
        userData.specialization = specialization || '';
        userData.hospital = hospital || '';
      }

      const user = new User(userData);

      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });

      res.status(201).json({ user, token });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


// 🔹 LOGIN
router.post("/login", async (req, res) => {
    const { email, phone, password } = req.body;
    if ((!email && !phone) || !password) {
        return res.status(400).json({ message: "email or phone and password are required" });
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

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });

        res.json({
            message: "Login successful",
            user: { ...user._doc, password: undefined },
            token
        });

    } catch (err) {
        res.status(500).json({ message: "Error in login" });
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
