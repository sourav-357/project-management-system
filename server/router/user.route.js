

import express from 'express';
import { forgotPassword, getUser, login, logout, registerUser, resetPassword } from '../controllers/auth.controller.js';
import multer from 'multer';
import { isAuthenticated } from '../middlewares/authMIddleware.js';



const router = express.Router();



router.post('/register', registerUser);
router.post('/login', login);
router.get('/me', isAuthenticated, getUser);
router.get('/logout', isAuthenticated, logout);
router.post('/password/forgot', isAuthenticated, forgotPassword);
router.put('/password/reset/:token', isAuthenticated, resetPassword);


export default router;

