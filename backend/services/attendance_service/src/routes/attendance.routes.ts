import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticateToken, requireUserAccess, requireAdminAccess } from '../middleware/auth.middleware';
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
  attendanceController.clockIn.bind(attendanceController)
);

router.post(
  '/clock-out',
  uploadSingle('photo'),
  requireFile,
  validateImageFile,
  validateRequest(attendanceSchemas.clockOut),
  attendanceController.clockOut.bind(attendanceController)
);

router.get(
  '/status/:userId',
  validateParams(attendanceSchemas.userIdParams),
  requireUserAccess,
  attendanceController.getAttendanceStatus.bind(attendanceController)
);

router.get(
  '/history/:userId',
  validateParams(attendanceSchemas.userIdParams),
  validateQuery(attendanceSchemas.getAttendanceHistoryQuery),
  requireUserAccess,
  attendanceController.getAttendanceHistory.bind(attendanceController)
);

router.get(
  '/today/:userId',
  validateParams(attendanceSchemas.userIdParams),
  requireUserAccess,
  attendanceController.getTodayAttendance.bind(attendanceController)
);

// Admin endpoints
router.get(
  '/company',
  validateQuery(attendanceSchemas.getCompanyAttendanceQuery),
  requireAdminAccess,
  attendanceController.getCompanyAttendance.bind(attendanceController)
);

router.get(
  '/flagged',
  validateQuery(attendanceSchemas.getFlaggedAttendanceQuery),
  requireAdminAccess,
  attendanceController.getFlaggedAttendance.bind(attendanceController)
);

router.post(
  '/:attendanceId/approve',
  validateParams(attendanceSchemas.attendanceIdParams),
  validateRequest(attendanceSchemas.approveAttendance),
  requireAdminAccess,
  attendanceController.approveAttendance.bind(attendanceController)
);

router.post(
  '/:attendanceId/reject',
  validateParams(attendanceSchemas.attendanceIdParams),
  validateRequest(attendanceSchemas.rejectAttendance),
  requireAdminAccess,
  attendanceController.rejectAttendance.bind(attendanceController)
);

export default router;
