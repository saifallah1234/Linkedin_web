const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connection.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Connections
 *   description: Manage user connections (friends, requests)
 */

/**
 * @swagger
 * /connection/request/{userId}:
 *   post:
 *     summary: Send a connection request to a user
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to send request to
 *     responses:
 *       200:
 *         description: Connection request sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/request/:userId', authenticate, connectionController.sendConnectionRequest);

/**
 * @swagger
 * /connection/respond/{connectionId}:
 *   put:
 *     summary: Respond to a connection request
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the connection request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [ACCEPTED, REJECTED]
 *                 description: Action to perform on the request
 *     responses:
 *       200:
 *         description: Connection request responded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/respond/:connectionId', authenticate, connectionController.respondToRequest);

/**
 * @swagger
 * /connection/pending:
 *   get:
 *     summary: Get all incoming pending connection requests
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests
 *       401:
 *         description: Unauthorized
 */
router.get('/pending', authenticate, connectionController.getPendingRequests);

/**
 * @swagger
 * /connection:
 *   get:
 *     summary: Get all my connections (friends)
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of connections retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, connectionController.getMyConnections);

/**
 * @swagger
 * /connection/disconnect/{userId}:
 *   delete:
 *     summary: Disconnect (unfriend) a user
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to disconnect from
 *     responses:
 *       200:
 *         description: User disconnected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Connection not found
 */
router.delete('/disconnect/:userId', authenticate, connectionController.disconnect);



/**
 * @swagger
 * /connection/status/{userId}:
 *   get:
 *     summary: Check connection status with a user
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to check connection status with
 *     responses:
 *       200:
 *         description: Connection status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/status/:userId', authenticate, connectionController.checkConnectionStatus);


module.exports = router;
