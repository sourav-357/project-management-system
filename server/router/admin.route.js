

import express from 'express';
import { createStudent, deleteStudent, updateStudent } from '../controllers/admin.controller.js';
import multer from 'multer';
import { isAuthenticated, isAuthorized } from '../middlewares/authMIddleware.js';



const router = express.Router();


router.post('/create-student', isAuthenticated, isAuthorized('Admin'), createStudent);
router.put('/update-student/:id', isAuthenticated, isAuthorized('Admin'), updateStudent);
router.delete('/delete-student/:id', isAuthenticated, isAuthorized('Admin'), deleteStudent);


export default router;


