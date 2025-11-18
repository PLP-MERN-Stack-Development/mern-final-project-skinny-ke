import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} from '../controllers/authController.js';
import {
  protect,
  verifyRefreshToken,
  logAuth
} from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateProfile,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, logAuth('register_attempt'), register);
router.post('/login', validateLogin, logAuth('login_attempt'), login);
router.post('/refresh', verifyRefreshToken, logAuth('token_refresh'), refreshToken);
router.post('/forgot-password', validateForgotPassword, logAuth('password_reset_request'), forgotPassword);
router.post('/reset-password', validateResetPassword, logAuth('password_reset'), resetPassword);
router.post('/verify-email', validateVerifyEmail, logAuth('email_verification'), verifyEmail);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/logout', logAuth('logout'), logout);
router.get('/me', getMe);
router.put('/me', validateUpdateProfile, logAuth('profile_update'), updateProfile);
router.put('/change-password', validateChangePassword, logAuth('password_change'), changePassword);
router.post('/resend-verification', logAuth('verification_resend'), resendVerification);

export default router;