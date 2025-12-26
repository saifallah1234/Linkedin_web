const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controllers/notification.controller');
// const auth = require('../middlewares/auth.middleware'); // or your mockAuth
const auth = require('../middleware/mockAuth'); // or your mockAuth

router.use(auth); // All notification routes require login

// GET /api/notifications
router.get('/', notificationCtrl.getNotifications);

// PUT /api/notifications/:id/read
router.put('/:id/read', notificationCtrl.readNotification);

module.exports = router;