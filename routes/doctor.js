const express = require("express");
const router = express.Router();
const {
  addDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  getDoctorAvailability
} = require("../controllers/doctorController");

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/", asyncHandler(addDoctor));
router.get("/", asyncHandler(getDoctors));
router.get("/patients/:doctorId", asyncHandler(getDoctorPatients));
router.get("/availability/:doctorId", asyncHandler(getDoctorAvailability));
router.get("/:id", asyncHandler(getDoctorById));
router.put("/:id", asyncHandler(updateDoctor));
router.delete("/:id", asyncHandler(deleteDoctor));

module.exports = router;