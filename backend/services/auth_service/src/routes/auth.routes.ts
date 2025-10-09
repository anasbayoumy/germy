import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken, requirePlatformAdmin, requireCompanySuperAdmin, requireCompanyAdmin } from '../middleware/auth.middleware';
import { 
  loginSchema, 
  registerSchema, 
  registerPlatformAdminSchema,
  registerCompanySuperAdminSchema,
  registerCompanyAdminSchema,
  registerEmployeeSchema,
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '../schemas/auth.schemas';

const router = express.Router();
const authController = new AuthController();

// Public routes - Role-specific login endpoints
router.post('/platform/login', validateRequest(loginSchema), authController.loginPlatformAdmin.bind(authController));
router.post('/super_admin/login', validateRequest(loginSchema), authController.loginSuperAdmin.bind(authController));
router.post('/admin/login', validateRequest(loginSchema), authController.loginAdmin.bind(authController));
router.post('/user/login', validateRequest(loginSchema), authController.loginUser.bind(authController));

// Legacy login endpoint (for backward compatibility)
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));

// Role-specific registration endpoints
router.post('/platform/register', authenticateToken, requirePlatformAdmin, validateRequest(registerPlatformAdminSchema), authController.registerPlatformAdmin.bind(authController));
router.post('/super_admin/register', validateRequest(registerCompanySuperAdminSchema), authController.registerCompanySuperAdmin.bind(authController));
router.post('/admin/register', authenticateToken, requireCompanySuperAdmin, validateRequest(registerCompanyAdminSchema), authController.registerCompanyAdmin.bind(authController));
router.post('/user/register', authenticateToken, requireCompanyAdmin, validateRequest(registerEmployeeSchema), authController.registerEmployee.bind(authController));

// Legacy registration endpoint (for backward compatibility)
router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));

// Other public routes
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword.bind(authController));
router.post('/verify-token', authController.verifyToken.bind(authController));

// Protected routes
router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.post('/refresh', authenticateToken, authController.refreshToken.bind(authController));
//=======================================================================================================
//=======================================================================================================
router.get('/me', authenticateToken, authController.getCurrentUser.bind(authController));

export default router;