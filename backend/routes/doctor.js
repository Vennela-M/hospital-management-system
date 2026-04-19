const express = require("express");
const router = express.Router();
const {
  addDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  getDoctorAvailability,
  updateDoctorAvailability,
  submitDoctorQuestion,
  getDoctorMessages
} = require("../controllers/doctorController");
const { auth, requireRole } = require("../middleware/auth");

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/", auth, requireRole(["admin"]), asyncHandler(addDoctor));
router.get("/", auth, asyncHandler(getDoctors));
router.get("/patients/:doctorId", auth, asyncHandler(getDoctorPatients));
router.get("/availability/:doctorId", auth, asyncHandler(getDoctorAvailability));
router.put("/availability/:doctorId", auth, requireRole(["doctor"]), asyncHandler(updateDoctorAvailability));
router.post("/:doctorId/questions", auth, requireRole(["user"]), asyncHandler(submitDoctorQuestion));
router.get("/messages", auth, requireRole(["doctor"]), asyncHandler(getDoctorMessages));
router.get("/:id", auth, asyncHandler(getDoctorById));
router.put("/:id", auth, requireRole(["admin"]), asyncHandler(updateDoctor));
router.delete("/:id", auth, requireRole(["admin"]), asyncHandler(deleteDoctor));

module.exports = router;