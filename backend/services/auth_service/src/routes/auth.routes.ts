import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken, requirePlatformAdmin, requireAdminOrSuperAdmin } from '../middleware/auth.middleware';
import { 
  authLimiter, 
  passwordResetLimiter, 
  registrationLimiter, 
  tokenVerificationLimiter,
  platformAdminLimiter 
} from '../middleware/rate-limiting.middleware';
import {
  loginSchema,
  registerSchema,
  registerPlatformAdminSchema,
  registerCompanySuperAdminSchema,
  registerUserWithDomainSchema,
  registerAdminWithDomainSchema,
  manualRegisterUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../schemas/auth.schemas';

const router = express.Router();
const authController = new AuthController();

// Public routes - Role-specific login endpoints (with auth rate limiting)
router.post('/platform/login', authLimiter, validateRequest(loginSchema), authController.loginPlatformAdmin.bind(authController));
router.post('/super_admin/login', authLimiter, validateRequest(loginSchema), authController.loginSuperAdmin.bind(authController));
router.post('/admin/login', authLimiter, validateRequest(loginSchema), authController.loginAdmin.bind(authController));
router.post('/user/login', authLimiter, validateRequest(loginSchema), authController.loginUser.bind(authController));

// Legacy login endpoint (for backward compatibility)
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login.bind(authController));

// Role-specific registration endpoints (with registration rate limiting)
router.post('/platform/register', platformAdminLimiter, authenticateToken, requirePlatformAdmin, validateRequest(registerPlatformAdminSchema), authController.registerPlatformAdmin.bind(authController));
router.post('/super_admin/register', registrationLimiter, validateRequest(registerCompanySuperAdminSchema), authController.registerCompanySuperAdmin.bind(authController));

// Domain-based registration endpoints (no authentication required)
router.post('/admin/register', registrationLimiter, validateRequest(registerAdminWithDomainSchema), authController.registerAdminWithDomain.bind(authController));
router.post('/user/register', registrationLimiter, validateRequest(registerUserWithDomainSchema), authController.registerUserWithDomain.bind(authController));

// Legacy registration endpoint (for backward compatibility)
router.post('/register', registrationLimiter, validateRequest(registerSchema), authController.register.bind(authController));

// Other public routes (with specific rate limiting)
router.post('/forgot-password', passwordResetLimiter, validateRequest(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', passwordResetLimiter, validateRequest(resetPasswordSchema), authController.resetPassword.bind(authController));
router.post('/verify-token', tokenVerificationLimiter, authController.verifyToken.bind(authController));

// Protected routes
router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.post('/refresh', authenticateToken, authController.refreshToken.bind(authController));
//=======================================================================================================
//=======================================================================================================
router.get('/me', authenticateToken, authController.getCurrentUser.bind(authController));

// Admin manual registration (for rejected users)
router.post('/manual-register', authenticateToken, requireAdminOrSuperAdmin, validateRequest(manualRegisterUserSchema), authController.manualRegisterUser.bind(authController));

export default router;