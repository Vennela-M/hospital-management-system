const express = require("express");
const router = express.Router();
const Hospital = require("../models/Hospital");
const { auth, requireRole } = require("../middleware/auth");

// ✅ CREATE HOSPITAL
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
    try {
      const hospital = await Hospital.create(req.body);
      res.json(hospital);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// ✅ PUBLIC HOSPITAL AVAILABILITY SUMMARY
router.get("/availability", async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    const summary = hospitals.reduce(
      (acc, hospital) => {
        const occupiedBeds = Math.max(0, (hospital.totalBeds || 0) - (hospital.availableBeds || 0));
        acc.totalHospitals += 1;
        acc.totalBeds += hospital.totalBeds || 0;
        acc.availableBeds += hospital.availableBeds || 0;
        acc.occupiedBeds += occupiedBeds;
        acc.totalDoctors += hospital.doctors ? hospital.doctors.length : 0;
        acc.activeDepartments += hospital.departments ? hospital.departments.filter(dept => dept.status === 'active').length : 0;
        return acc;
      },
      {
        totalHospitals: 0,
        totalBeds: 0,
        availableBeds: 0,
        occupiedBeds: 0,
        totalDoctors: 0,
        activeDepartments: 0
      }
    );

    const hospitalsList = hospitals.map(hospital => ({
      id: hospital._id,
      name: hospital.name,
      address: hospital.address,
      phone: hospital.phone,
      email: hospital.email,
      totalBeds: hospital.totalBeds || 0,
      availableBeds: hospital.availableBeds || 0,
      occupiedBeds: Math.max(0, (hospital.totalBeds || 0) - (hospital.availableBeds || 0)),
      departmentsCount: hospital.departments ? hospital.departments.length : 0,
      activeDepartments: hospital.departments ? hospital.departments.filter(dept => dept.status === 'active').length : 0,
      doctorCount: hospital.doctors ? hospital.doctors.length : 0,
      description: hospital.description || ''
    }));

    res.json({ summary, hospitals: hospitalsList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET ALL HOSPITALS
router.get("/", auth, async (req, res) => {
    try {
      const hospitals = await Hospital.find().populate('doctors', 'name specialization');
      res.json(hospitals);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// ✅ GET HOSPITAL BY ID
router.get("/:id", auth, async (req, res) => {
    try {
      const hospital = await Hospital.findById(req.params.id).populate('doctors', 'name specialization');
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// ✅ UPDATE HOSPITAL
router.put("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const updated = await Hospital.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('doctors', 'name specialization');
    if (!updated) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE HOSPITAL
router.delete("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const deleted = await Hospital.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    res.json({ message: "Hospital deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADD DEPARTMENT TO HOSPITAL
router.post("/:id/departments", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    hospital.departments.push(req.body);
    await hospital.save();
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE DEPARTMENT
router.put("/:hospitalId/departments/:deptIndex", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const deptIndex = parseInt(req.params.deptIndex);
    if (deptIndex < 0 || deptIndex >= hospital.departments.length) {
      return res.status(404).json({ message: "Department not found" });
    }

    hospital.departments[deptIndex] = { ...hospital.departments[deptIndex], ...req.body };
    await hospital.save();
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE DEPARTMENT
router.delete("/:hospitalId/departments/:deptIndex", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const deptIndex = parseInt(req.params.deptIndex);
    if (deptIndex < 0 || deptIndex >= hospital.departments.length) {
      return res.status(404).json({ message: "Department not found" });
    }

    hospital.departments.splice(deptIndex, 1);
    await hospital.save();
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;