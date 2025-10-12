import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticateToken, requireUserAccess } from '../middleware/auth.middleware';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.middleware';
import { uploadSingle, requireFile, validateImageFile } from '../middleware/upload.middleware';
import { attendanceSchemas } from '../schemas/attendance.schemas';

const router = Router();
const attendanceController = new AttendanceController();

// Apply authentication to all routes
router.use(authenticateToken);

// Core attendance endpoints
router.post(
  '/clock-in',
  uploadSingle('photo'),
  requireFile,
  validateImageFile,
  validateRequest(attendanceSchemas.clockIn),
  attendanceController.clockIn
);

router.post(
  '/clock-out',
  uploadSingle('photo'),
  requireFile,
  validateImageFile,
  validateRequest(attendanceSchemas.clockOut),
  attendanceController.clockOut
);

router.get(
  '/status/:userId',
  validateParams(attendanceSchemas.userIdParams),
  requireUserAccess,
  attendanceController.getAttendanceStatus
);

router.get(
  '/history/:userId',
  validateParams(attendanceSchemas.userIdParams),
  validateQuery(attendanceSchemas.getAttendanceHistoryQuery),
  requireUserAccess,
  attendanceController.getAttendanceHistory
);

router.get(
  '/today/:userId',
  validateParams(attendanceSchemas.userIdParams),
  requireUserAccess,
  attendanceController.getTodayAttendance
);

// Management endpoints
router.get(
  '/company/:companyId',
  validateParams(attendanceSchemas.companyIdParams),
  validateQuery(attendanceSchemas.getCompanyAttendanceQuery),
  attendanceController.getCompanyAttendance
);

router.get(
  '/flagged/:companyId',
  validateParams(attendanceSchemas.companyIdParams),
  validateQuery(attendanceSchemas.getFlaggedAttendanceQuery),
  attendanceController.getFlaggedAttendance
);

// Approval endpoints
router.put(
  '/:attendanceId/approve',
  validateParams(attendanceSchemas.attendanceIdParams),
  validateRequest(attendanceSchemas.approveAttendance),
  attendanceController.approveAttendance
);

router.put(
  '/:attendanceId/reject',
  validateParams(attendanceSchemas.attendanceIdParams),
  validateRequest(attendanceSchemas.rejectAttendance),
  attendanceController.rejectAttendance
);

router.put(
  '/:attendanceId/flag',
  validateParams(attendanceSchemas.attendanceIdParams),
  validateRequest(attendanceSchemas.flagAttendance),
  attendanceController.flagAttendance
);

export default router;
