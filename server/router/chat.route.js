import express from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/friends', chatController.getConnectedFriends);
router.get('/call-history', chatController.getCallHistory);
router.delete('/call-history/:historyId', chatController.deleteCallHistoryRecord);
router.get('/messages/:partnerId', chatController.getConversationMessages);
router.delete('/clear-chat/:partnerId', chatController.clearChat);
router.post('/messages/:messageId/react', chatController.reactToMessage);

export default router;
