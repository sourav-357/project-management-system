

import express from 'express';
import * as studentController from '../controllers/student.controller.js';
import multer from 'multer';
import { isAuthenticated, isAuthorized } from '../middlewares/authMIddleware.js';
import { upload, handleUploadError } from '../middlewares/upload.js';



const router = express.Router();



router.get(
    '/project', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.getStudentProject
);

router.post(
    '/project-proposal', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.submitProposal
);

router.post(
    '/upload/:projectId', 
    isAuthenticated, 
    isAuthorized('Student'), 
    upload.array('files', 10),
    handleUploadError, 
    studentController.uploadFiles
);

router.get(
    '/fetch-supervisors', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.getAvailableSupervisors
);

router.get(
    '/supervisor', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.getSupervisor
);

router.post(
    '/supervisor-request', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.requestSupervisor
);

router.get(
    '/feedback/:projectId', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.getFeedback
);

router.get(
    '/fetch-dashboard-stats', 
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.getDashboardStats
);

router.get(
    '/download/:projectId/:fileId',
    isAuthenticated, 
    isAuthorized('Student'), 
    studentController.downloadFile
);



export default router;


