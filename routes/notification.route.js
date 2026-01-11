const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controllers/notification.controller');
const { authenticate, isUser } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification endpoints
 */

router.use(authenticate);
//router.use(authenticate, isUser);

// Get unread count
router.get('/unread/count', notificationCtrl.getUnreadCount);

// Mark all as read
router.put('/read-all', notificationCtrl.markAllAsRead);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the logged-in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', notificationCtrl.getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', notificationCtrl.readNotification);

module.exports = router;