const express = require('express');
const router = express.Router();
const messageCtrl = require('../controllers/message.controller');
const auth = require('../middleware/mockAuth'); // Use real auth later
const upload = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messaging endpoints
 */

// Protect all messaging routes
router.use(auth);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get inbox / list of conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/conversations', messageCtrl.getInbox);

/**
 * @swagger
 * /api/messages/{userId}:
 *   get:
 *     summary: Get chat history with a specific user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to fetch chat history
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId', messageCtrl.getHistory);

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message (with optional attachments)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               recipientId:
 *                 type: string
 *                 description: ID of the recipient user
 *               content:
 *                 type: string
 *                 description: Text content of the message
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Attachments (max 5 files)
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  upload.array('files', 5),
  (req, res, next) => {
    if (req.files) {
      req.body.attachments = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith('image/')
          ? 'image'
          : file.mimetype.startsWith('video/')
          ? 'video'
          : 'file'
      }));
    }
    next();
  },
  messageCtrl.send
);

module.exports = router;
