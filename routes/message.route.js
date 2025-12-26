const express = require('express');
const router = express.Router();
const messageCtrl = require('../controllers/message.controller');
const auth = require('../middleware/mockAuth');
// const auth = require('../middlewares/auth.middleware');
const upload = require('../middleware/upload');

// Protect all messaging routes
router.use(auth);

// GET /api/messages/conversations (Inbox)
router.get('/conversations', messageCtrl.getInbox);

// GET /api/messages/:userId (Specific Chat)
router.get('/:userId', messageCtrl.getHistory);

// POST /api/messages (Send message with optional attachments)
router.post('/', upload.array('files', 5), (req, res, next) => {
    // Map uploaded files to your attachment schema
    if (req.files) {
        req.body.attachments = req.files.map(file => ({
            url: file.path,
            type: file.mimetype.startsWith('image/') ? 'image' : 
                  file.mimetype.startsWith('video/') ? 'video' : 'file'
        }));
    }
    next();
}, messageCtrl.send);

module.exports = router;