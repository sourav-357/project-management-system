

import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import multer from 'multer';
import { isAuthenticated, isAuthorized } from '../middlewares/authMIddleware.js';



const router = express.Router();


router.post('/create-student', isAuthenticated, isAuthorized('Admin'), adminController.createStudent);
router.put('/update-student/:id', isAuthenticated, isAuthorized('Admin'), adminController.updateStudent);
router.delete('/delete-student/:id', isAuthenticated, isAuthorized('Admin'), adminController.deleteStudent);

router.post('/create-teacher', isAuthenticated, isAuthorized('Admin'), adminController.createTeacher);
router.put('/update-teacher/:id', isAuthenticated, isAuthorized('Admin'), adminController.updateTeacher);
router.delete('/delete-teacher/:id', isAuthenticated, isAuthorized('Admin'), adminController.deleteTeacher);

router.get('/getAllUsers', isAuthenticated, isAuthorized('Admin'), adminController.getAllUsers);
router.get('/projects', isAuthenticated, isAuthorized('Admin'), adminController.getAllProjects);


export default router;


