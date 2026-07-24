import express from 'express';
import * as connectionController from '../controllers/connection.controller.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/explore', connectionController.exploreUsers);
router.get('/my-connections', connectionController.getMyConnections);
router.get('/friends', connectionController.getMyConnections); // Alias endpoint
router.post('/request', connectionController.sendConnectionRequest);
router.put('/respond/:connectionId', connectionController.respondToRequest);
router.put('/request/:connectionId/respond', connectionController.respondToRequest); // Alias endpoint
router.get('/pending', connectionController.getPendingRequests);
router.get('/pending/incoming', connectionController.getPendingRequests); // Alias endpoint
router.get('/pending/outgoing', connectionController.getPendingRequests); // Alias endpoint
router.get('/history', connectionController.getConnectionHistory);
router.get('/blocked', connectionController.getBlockedUsers);
router.put('/unblock/:targetUserId', connectionController.unblockUser);
router.delete('/unblock/:targetUserId', connectionController.unblockUser); // Alias endpoint
router.delete('/remove/:targetUserId', connectionController.removeConnection);
router.put('/block-user/:targetUserId', connectionController.blockUserDirectly);
router.post('/block/:targetUserId', connectionController.blockUserDirectly); // Alias endpoint
router.put('/block/:targetUserId', connectionController.blockUserDirectly); // Alias endpoint

export default router;
