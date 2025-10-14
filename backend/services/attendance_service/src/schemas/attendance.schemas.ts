import { z } from 'zod';

// Clock-in schema
export const clockInSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid userId format'),
    companyId: z.string().uuid('Invalid companyId format'),
    workMode: z.enum(['onsite', 'remote', 'hybrid'], {
      errorMap: () => ({ message: 'Work mode must be onsite, remote, or hybrid' })
    }),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().positive().optional(),
      address: z.string().optional()
    }).optional(),
    deviceInfo: z.string().optional(),
    userAgent: z.string().optional()
  })
});

// Clock-out schema
export const clockOutSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid userId format'),
    companyId: z.string().uuid('Invalid companyId format'),
    attendanceId: z.string().uuid('Invalid attendanceId format')
  })
});

// User ID parameter schema
export const userIdParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid userId format')
  })
});

// Attendance ID parameter schema
export const attendanceIdParamsSchema = z.object({
  params: z.object({
    attendanceId: z.string().uuid('Invalid attendanceId format')
  })
});

// Get attendance history query schema
export const getAttendanceHistoryQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    workMode: z.enum(['onsite', 'remote', 'hybrid']).optional()
  })
});

// Get company attendance query schema
export const getCompanyAttendanceQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    date: z.string().datetime().optional(),
    workMode: z.enum(['onsite', 'remote', 'hybrid']).optional(),
    status: z.enum(['active', 'completed', 'flagged', 'approved', 'rejected']).optional()
  })
});

// Get flagged attendance query schema
export const getFlaggedAttendanceQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    riskLevel: z.enum(['low', 'medium', 'high']).optional()
  })
});

// Approve attendance schema
export const approveAttendanceSchema = z.object({
  body: z.object({
    notes: z.string().optional()
  })
});

// Reject attendance schema
export const rejectAttendanceSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required'),
    notes: z.string().optional()
  })
});

// Export all schemas
export const attendanceSchemas = {
  clockIn: clockInSchema,
  clockOut: clockOutSchema,
  userIdParams: userIdParamsSchema,
  attendanceIdParams: attendanceIdParamsSchema,
  getAttendanceHistoryQuery: getAttendanceHistoryQuerySchema,
  getCompanyAttendanceQuery: getCompanyAttendanceQuerySchema,
  getFlaggedAttendanceQuery: getFlaggedAttendanceQuerySchema,
  approveAttendance: approveAttendanceSchema,
  rejectAttendance: rejectAttendanceSchema
};
