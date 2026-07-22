import express from 'express';
import * as connectionController from '../controllers/connection.controller.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/explore', connectionController.exploreUsers);
router.post('/request', connectionController.sendConnectionRequest);
router.put('/respond/:connectionId', connectionController.respondToRequest);
router.get('/pending', connectionController.getPendingRequests);
router.get('/history', connectionController.getConnectionHistory);
router.get('/blocked', connectionController.getBlockedUsers);
router.put('/unblock/:targetUserId', connectionController.unblockUser);
router.delete('/remove/:targetUserId', connectionController.removeConnection);
router.put('/block-user/:targetUserId', connectionController.blockUserDirectly);

export default router;
