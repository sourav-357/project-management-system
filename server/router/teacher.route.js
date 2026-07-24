import express from 'express';
import * as teacherController from '../controllers/teacher.controller.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated, isAuthorized('Teacher'));

router.get('/requests', teacherController.getIncomingRequests);
router.post('/requests/:requestId/respond', teacherController.respondToRequest);
router.get('/students', teacherController.getAssignedStudents);
router.put('/students/:studentId/drop', teacherController.dropSupervision);
router.get('/projects', teacherController.getSupervisedProjects);
router.get('/proposals', teacherController.getSupervisedProjects); // Alias endpoint
router.put('/projects/:projectId/review', teacherController.reviewProposal);
router.put('/projects/:projectId/complete', teacherController.completeProject);
router.get('/dashboard-stats', teacherController.getTeacherDashboardStats);

export default router;
