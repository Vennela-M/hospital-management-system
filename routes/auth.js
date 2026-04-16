const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("multer");

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
router.post("/register", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
  
      const user = new User({
        name,
        email,
        password,
        role
      });
  
      await user.save();
  
      res.status(201).json(user);
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

        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid password" });
        }
        res.json({
            message: "Login successful",
            user
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

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ message: "Error resetting password" });
    }
});


// 🔥 UPDATE PROFILE (VERY IMPORTANT)
router.post("/updateProfile", async (req, res) => {
    const { 
        email, 
        phone, 
        name, 
        age, 
        gender, 
        bloodGroup,
        address, 
        diseases, 
        allergies, 
        medications,
        height,
        weight,
        surgeries,
        conditions,
        reports
    } = req.body;

    try {
        let user;

        // 🔍 Find user by email or phone
        if (email) {
            user = await User.findOne({ email });
        }

        if (!user && phone) {
            user = await User.findOne({ phone });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 🔥 Update fields
        user.name = name;
        user.phone = phone;
        user.age = age;
        user.gender = gender;
        user.bloodGroup = bloodGroup;

        user.height = height;
        user.weight = weight;
        user.address = address;
        
        user.diseases = diseases;
        user.allergies = allergies;
        user.medications = medications;
        user.surgeries = surgeries;
        user.conditions = conditions;
        await user.save();

        res.json({ message: "Profile updated successfully" });

    } catch (err) {
        res.status(500).json({ message: "Error updating profile" });
    }
});

// 🔹 GET PROFILE
router.get("/getProfile/:value", async (req, res) => {
    try {
        const value = req.params.value;
        let user;

        if (value && value.includes("@")) {
            user = await User.findOne({ email: value });
        }

        if (!user && value) {
            user = await User.findOne({ phone: value });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

    } catch (err) {
        res.status(500).json({ message: "Error fetching profile" });
    }
});

router.post("/uploadReport", upload.single("report"), async (req, res) => {
    try {
        const { email, phone } = req.body;

        let user;

        if (email) user = await User.findOne({ email });
        if (!user && phone) user = await User.findOne({ phone });

        if (!user) return res.status(404).json({ message: "User not found" });
        if (!req.file) return res.status(400).json({ message: "report file is required" });

        if (!user.reports) user.reports = [];

        user.reports.push(req.file.filename);

        await user.save();

        res.status(201).json({ message: "Report uploaded", file: req.file.filename });

    } catch (err) {
        res.status(500).json({ message: "Upload error" });
    }
});
module.exports = router;
