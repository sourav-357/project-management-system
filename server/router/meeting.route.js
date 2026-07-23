import express from 'express';
import * as meetingController from '../controllers/meeting.controller.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/available-invitees', meetingController.getAvailableInvitees);
router.get('/', meetingController.getMyMeetings);
router.get('/:meetingId', meetingController.getMeetingById);
router.post('/', meetingController.createMeeting);
router.put('/:meetingId/join', meetingController.joinMeeting);
router.put('/:meetingId/leave', meetingController.leaveMeeting);
router.put('/:meetingId/end', meetingController.endMeeting);
router.delete('/:meetingId', meetingController.deleteMeeting);

export default router;
