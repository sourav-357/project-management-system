import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated, isAuthorized('Admin'));

// Student Management
router.post('/create-student', adminController.createStudent);
router.put('/update-student/:id', adminController.updateStudent);
router.delete('/delete-student/:id', adminController.deleteStudent);

// Teacher Management
router.post('/create-teacher', adminController.createTeacher);
router.put('/update-teacher/:id', adminController.updateTeacher);
router.delete('/delete-teacher/:id', adminController.deleteTeacher);

// Status Management & General Users
router.put('/users/:id/status', adminController.toggleUserStatus);
router.get('/getAllUsers', adminController.getAllUsers);

// Projects & Workflows
router.get('/projects', adminController.getAllProjects);
router.put('/projects/:projectId/review', adminController.reviewProposalAdmin);
router.post('/assign-supervisor', adminController.assignSupervisor);

// Dashboard Analytics
router.get('/dashboard-stats', adminController.getAdminDashboardStats);

export default router;
