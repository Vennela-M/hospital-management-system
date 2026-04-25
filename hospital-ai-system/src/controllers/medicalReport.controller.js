const MedicalReport = require('../models/medicalReport.model');
const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/response');
const ROLES = require('../config/roles');

/**
 * POST /api/medical-reports
 * Add a medical report. Accepts base64 file data or a plain text description.
 */
const addReport = async (req, res, next) => {
  try {
    const { patientId, title, report, fileUrl, fileData, fileName, fileType, date } = req.body;

    // Must have at least a title + one of: report text, fileUrl, or fileData
    if (!report && !fileUrl && !fileData) {
      return sendError(res, 400, 'Provide at least a report description, a file URL, or file data.');
    }

    let targetPatientId;
    if (req.user.role === ROLES.PATIENT) {
      targetPatientId = req.user._id;
    } else {
      if (!patientId) return sendError(res, 400, 'patientId is required when adding a report for a patient.');
      const patient = await User.findById(patientId);
      if (!patient || patient.role !== ROLES.PATIENT) return sendError(res, 404, 'Patient not found.');
      targetPatientId = patientId;
    }

    const medicalReport = await MedicalReport.create({
      patient:    targetPatientId,
      title,
      report:     report || '',
      fileUrl:    fileUrl || null,
      fileData:   fileData || null,
      fileName:   fileName || null,
      fileType:   fileType || null,
      date:       date ? new Date(date) : Date.now(),
      uploadedBy: req.user._id,
    });

    await medicalReport.populate([
      { path: 'patient',    select: 'name email' },
      { path: 'uploadedBy', select: 'name role' },
    ]);

    // Return without fileData in the response to keep payload small
    const responseDoc = medicalReport.toObject();
    delete responseDoc.fileData;

    return sendSuccess(res, 201, 'Medical report added.', { medicalReport: responseDoc });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/medical-reports
 * Get all reports for the logged-in patient (fileData excluded for speed).
 */
const getMyReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      MedicalReport.find({ patient: req.user._id })
        .select('-fileData')          // exclude heavy base64 from list
        .populate('uploadedBy', 'name role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      MedicalReport.countDocuments({ patient: req.user._id }),
    ]);

    return sendSuccess(res, 200, 'Medical reports fetched.', {
      reports,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/medical-reports/:patientId
 * Doctor or Admin — get all reports for a specific patient.
 */
const getReportsByPatientId = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const patient = await User.findById(req.params.patientId);
    if (!patient || patient.role !== ROLES.PATIENT) {
      return sendError(res, 404, 'Patient not found.');
    }

    const [reports, total] = await Promise.all([
      MedicalReport.find({ patient: req.params.patientId })
        .select('-fileData')
        .populate('uploadedBy', 'name role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      MedicalReport.countDocuments({ patient: req.params.patientId }),
    ]);

    return sendSuccess(res, 200, 'Medical reports fetched.', {
      reports,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/medical-reports/file/:id
 * Return the base64 file data for a single report (patient owner only).
 */
const getReportFile = async (req, res, next) => {
  try {
    const report = await MedicalReport.findById(req.params.id).select('patient fileData fileName fileType');
    if (!report) return sendError(res, 404, 'Report not found.');

    // Only the owning patient (or doctor/admin) can download
    if (
      req.user.role === ROLES.PATIENT &&
      report.patient.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'Not authorized to access this report.');
    }

    if (!report.fileData) return sendError(res, 404, 'No file attached to this report.');

    return sendSuccess(res, 200, 'File fetched.', {
      fileData: report.fileData,
      fileName: report.fileName,
      fileType: report.fileType,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addReport, getMyReports, getReportsByPatientId, getReportFile };
