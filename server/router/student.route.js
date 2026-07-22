import express from 'express';
import * as studentController from '../controllers/student.controller.js';
import { validateProposalInput, validateSupervisorRequestInput } from '../validations/projectValidation.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';
import { upload, handleUploadError } from '../middlewares/upload.js';

const router = express.Router();

router.use(isAuthenticated, isAuthorized('Student'));

router.get('/project', studentController.getStudentProject);
router.post('/project-proposal', validateProposalInput, studentController.submitProposal);
router.post('/milestones/:milestoneId/submit', studentController.submitMilestone);
router.post('/upload/:projectId', upload.array('files', 10), handleUploadError, studentController.uploadFiles);
router.get('/fetch-supervisors', studentController.getAvailableSupervisors);
router.get('/supervisor', studentController.getSupervisor);
router.post('/supervisor-request', validateSupervisorRequestInput, studentController.requestSupervisor);
router.get('/feedback/:projectId', studentController.getFeedback);
router.get('/fetch-dashboard-stats', studentController.getDashboardStats);
router.get('/download/:projectId/:fileId', studentController.downloadFile);

export default router;
