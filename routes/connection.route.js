const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connection.controller');
const protect = require('../middleware/mockAuth'); // Switch to real 'auth' later

// 1. Send a request to a User (by User ID)
// POST /api/connections/request/653a...
router.post('/request/:userId', protect, connectionController.sendConnectionRequest);

// 2. Respond to a request (by Connection Document ID)
// PUT /api/connections/respond/659b... 
// Body: { "action": "ACCEPTED" }
router.put('/respond/:connectionId', protect, connectionController.respondToRequest);

// 3. View incoming pending requests
// GET /api/connections/pending
router.get('/pending', protect, connectionController.getPendingRequests);

// 4. View all my friends
// GET /api/connections
router.get('/', protect, connectionController.getMyConnections);

module.exports = router;