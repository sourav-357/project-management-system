import express from 'express';
import * as deadlineController from '../controllers/deadline.controller.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/', deadlineController.getDeadlines);
router.post('/', isAuthorized('Admin', 'Teacher'), deadlineController.createDeadline);
router.delete('/:id', isAuthorized('Admin', 'Teacher'), deadlineController.deleteDeadline);

export default router;
