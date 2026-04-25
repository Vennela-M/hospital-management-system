/**
 * /api/hospital  — alias routes that proxy to the admin controller.
 * The admin.html frontend calls /api/hospital directly.
 */
const express = require('express');
const {
  createHospital,
  listHospitals,
  getHospital,
  updateHospital,
  deleteHospital,
  addDepartment,
  deleteDepartment,
  assignDoctorToHospital,
  removeDoctorFromHospital,
} = require('../controllers/admin.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const Hospital     = require('../models/hospital.model');
const Doctor       = require('../models/doctor.model');
const { sendSuccess, sendError } = require('../utils/response');
const ROLES = require('../config/roles');

const router = express.Router();

// ── PUBLIC — no auth required ─────────────────────────────────────────────────
/**
 * GET /api/hospital/public
 * Returns all hospitals with basic stats — used by the nearby-hospitals page.
 * No authentication required so unauthenticated visitors can see hospitals.
 */
router.get('/public', async (req, res, next) => {
  try {
    const hospitals = await Hospital.find()
      .populate({ path: 'doctors', select: 'name specialization experience availability' })
      .sort({ name: 1 })
      .lean();

    // Attach computed doctorCount and department info so the frontend doesn't have to
    const result = hospitals.map(h => ({
      ...h,
      doctorCount: (h.doctors || []).length,
      departmentInfo: (h.departments || []).map(d => ({
        name: d.name,
        head: d.head,
        doctorCount: d.doctorCount || 0,
        bedCount: d.bedCount || h.availableBeds || 0,
      })),
    }));

    return sendSuccess(res, 200, 'Hospitals fetched.', { hospitals: result });
  } catch (error) {
    next(error);
  }
});

// ── AUTHENTICATED ─────────────────────────────────────────────────────────────
router.use(authenticate);

// GET — admin and hospital role can read
router.get('/',    authorize(ROLES.ADMIN, ROLES.HOSPITAL), listHospitals);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.HOSPITAL), getHospital);

// Hospital role: update own bed availability
router.patch('/:id/beds', authorize(ROLES.ADMIN, ROLES.HOSPITAL), async (req, res, next) => {
  try {
    const { totalBeds, availableBeds } = req.body;
    if (totalBeds === undefined && availableBeds === undefined) {
      return sendError(res, 400, 'Provide totalBeds and/or availableBeds.');
    }

    const update = {};
    if (totalBeds     !== undefined) update.totalBeds     = Number(totalBeds);
    if (availableBeds !== undefined) update.availableBeds = Number(availableBeds);

    const hospital = await Hospital.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!hospital) return sendError(res, 404, 'Hospital not found.');

    // Update department counts
    const doctorCount = (hospital.doctors || []).length;
    const departmentsWithCounts = (hospital.departments || []).map(d => ({
      ...d,
      doctorCount,
      bedCount: hospital.availableBeds || 0,
    }));

    return sendSuccess(res, 200, 'Bed availability updated.', { 
      hospital: {
        ...hospital.toObject(),
        departments: departmentsWithCounts,
      }
    });
  } catch (error) { next(error); }
});

// Hospital role: assign/remove doctors from own hospital
router.post('/:id/assign-doctor',              authorize(ROLES.ADMIN, ROLES.HOSPITAL), assignDoctorToHospital);
router.delete('/:id/assign-doctor/:doctorId',  authorize(ROLES.ADMIN, ROLES.HOSPITAL), removeDoctorFromHospital);

// Admin-only write routes
router.post('/',                         authorize(ROLES.ADMIN), createHospital);
router.put('/:id',                       authorize(ROLES.ADMIN), updateHospital);
router.delete('/:id',                    authorize(ROLES.ADMIN), deleteHospital);
router.post('/:id/departments',          authorize(ROLES.ADMIN), addDepartment);
router.delete('/:id/departments/:index', authorize(ROLES.ADMIN), deleteDepartment);

module.exports = router;
