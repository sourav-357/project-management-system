import express from 'express';
import * as meetingController from '../controllers/meeting.controller.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/available-invitees', isAuthorized('Teacher', 'Admin'), meetingController.getAvailableInvitees);
router.get('/', meetingController.getMeetings);
router.get('/history', meetingController.getMeetingHistory);
router.delete('/history/:historyId', meetingController.deleteMeetingHistoryRecord);
router.get('/:meetingId', meetingController.getMeetingById);
router.post('/', isAuthorized('Teacher', 'Admin'), meetingController.createMeeting);
router.put('/:meetingId/end', isAuthorized('Teacher', 'Admin'), meetingController.endMeeting);

export default router;
