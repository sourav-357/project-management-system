

import express from 'express';
import * as studentController from '../controllers/student.controller.js';
import multer from 'multer';
import { isAuthenticated, isAuthorized } from '../middlewares/authMIddleware.js';



const router = express.Router();



router.post(
    '/project', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.getStudentProject
);

router.post(
    '/proposal', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.submitProposal
);

router.post(
    '/upload/:projectId', 
    isAuthenticated, 
    isAuthorized('Student'), 
    // upload.array('files', 10),
    // handleUploadError, 
    studentController.uploadFiles
);

router.get(
    '/get-available-supervisors', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.getAvailableSupervisors
);



export default router;


