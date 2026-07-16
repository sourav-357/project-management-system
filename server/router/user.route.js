

import express from 'express';
import { forgotPassword, getUser, login, logout, registerUser, resetPassword } from '../controllers/auth.controller.js';
import multer from 'multer';



const router = express.Router();



router.post('/register', registerUser);
router.post('/login', login);
router.get('/me', getUser);
router.get('/logout', logout);
router.put('/password/forgot', forgotPassword);
router.put('/password/reset/:token', resetPassword);


export default router;

