import express from 'express';
import {
    registerUser,
    login,
    refreshToken,
    getUser,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    changePassword,
    updateAvatar
} from '../controllers/auth.controller.js';
import { validateRegisterInput, validateLoginInput } from '../validations/authValidation.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import { upload, handleUploadError } from '../middlewares/upload.js';

const router = express.Router();

router.post('/register', validateRegisterInput, registerUser);
router.post('/login', validateLoginInput, login);
router.post('/refresh-token', refreshToken);
router.get('/me', isAuthenticated, getUser);
router.post('/logout', isAuthenticated, logout);
router.get('/logout', isAuthenticated, logout);
router.post('/logout-all', isAuthenticated, logoutAll);
router.post('/password/forgot', forgotPassword);
router.put('/password/reset/:token', resetPassword);
router.put('/password/change', isAuthenticated, changePassword);
router.put('/profile/avatar', isAuthenticated, upload.single('avatar'), handleUploadError, updateAvatar);

export default router;
