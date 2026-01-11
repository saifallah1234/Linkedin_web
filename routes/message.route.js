const express = require('express');
const router = express.Router();
const messageCtrl = require('../controllers/message.controller');
const { authenticate, isUser } = require('../middleware/auth');
const upload = require('../middleware/upload');
const mongoose = require('mongoose');

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messaging endpoints
 */

// Protect all messaging routes (users only)
//router.use(authenticate, isUser);
router.use(authenticate);

// Add this middleware to parse multipart form data
router.use(express.urlencoded({ extended: true }));

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
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
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
    console.log('=== MESSAGE ROUTE MIDDLEWARE ===');
    console.log('Form data keys:', Object.keys(req.body));
    console.log('Form data values:', req.body);
    console.log('Files:', req.files);
    
    // Validate that receiverId is present (not recipientId)
    if (!req.body.receiverId|| !req.body.receiverType) {
      console.log('ERROR: receiverId and receiverType are missing');
      return res.status(400).json({ 
        message: "receiverId and type is required" 
      });
    }
    
    const hasContent = req.body.content && req.body.content.trim().length > 0;
    const hasFiles = req.files && req.files.length > 0;

    if (!hasContent && !hasFiles) {
      console.log('ERROR: message must have content or attachments');
      return res.status(400).json({
        message: "Message must contain text or at least one attachment"
      });
    }
    
    // Convert receiverId to ObjectId if it's a valid string
    try {
      // This ensures the ID is in the correct format for MongoDB
      req.body.receiverId = new mongoose.Types.ObjectId(req.body.receiverId);
    } catch (error) {
      console.log('ERROR: Invalid receiverId format');
      return res.status(400).json({ 
        message: "Invalid receiverId format. Must be a valid MongoDB ObjectId" 
      });
    }
    
    // Process attachments
    if (req.files) {
      req.body.attachments = req.files.map(file => {
        let folder = "files";

        if (file.mimetype.startsWith("image/")) {
          folder = "images";
        } else if (file.mimetype.startsWith("video/")) {
          folder = "videos";
        }

        return {
          url: `/uploads/${folder}/${file.filename}`,
          type: file.mimetype.startsWith("image/")
            ? "image"
            : file.mimetype.startsWith("video/")
            ? "video"
            : "file",
          originalName: file.originalname,
        };
      });
    }

    
    console.log('=== END MIDDLEWARE ===');
    next();
  },
  messageCtrl.send
);

/**
 * @swagger
 * /api/messages/{userId}:
 *   delete:
 *     summary: Delete entire conversation with a user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose conversation to delete
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/:userId', messageCtrl.deleteConversation);

module.exports = router;