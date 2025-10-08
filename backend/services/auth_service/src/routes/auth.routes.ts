import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schemas';

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));
router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));
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