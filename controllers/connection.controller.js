const Connection = require('../models/Connection.model');
const User = require('../models/User.model');
const mongoose = require('mongoose');
const toStr = v => (v && v.toString ? v.toString() : v);
const notificationService = require('../services/notification.service');


exports.sendConnectionRequest = async (req, res) => {
  try {
    const requesterId = toStr(req.user.id);      // Me (string)
    const receiverId = req.params.userId; // The person I want to connect with

    // A. Prevent connecting to self
    if (requesterId === toStr(receiverId)) {
      return res.status(400).json({ message: "You cannot connect with yourself." });
    }

    // B. Check if Receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ message: "User not found." });
    }

    // C. Check if connection already exists (using your DB index logic)
    // We check for BOTH directions: A->B or B->A
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId: requesterId, receiverId: receiverId },
        { requesterId: receiverId, receiverId: requesterId }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'PENDING') {
        // If the existing pending request is FROM the receiver to the requester,
        // then the current user should accept/reject instead of sending a new one.
        if (toStr(existingConnection.requesterId) === receiverId) {
          return res.status(400).json({ message: "The user has already sent you a request. Please accept or reject it." });
        }
        return res.status(400).json({ message: "Connection request already pending." });
      }
      if (existingConnection.status === 'ACCEPTED') {
        return res.status(400).json({ message: "You are already connected." });
      }
      // If REJECTED, you might want to allow re-sending or block it. 
      // For now, we block to avoid spam.
      return res.status(400).json({ message: "Connection request was previously rejected." });
    }

    // D. Create the Request
    const newConnection = await Connection.create({
      requesterId,
      receiverId,
      status: 'PENDING'
    });

    // Send notification to receiver
    try {
      await notificationService.createNotification(
        { id: receiverId, type: 'User' },
        { id: requesterId, type: req.user.type || 'User' },
        'connection_request',
        { id: newConnection._id, type: 'Post' }
      );
    } catch (err) {
      console.error('Error creating connection notification:', err);
    }

    res.status(201).json({ message: "Connection request sent", connection: newConnection });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// --- 2. Accept or Reject Request ---
// We use one function for both actions to keep code clean
exports.respondToRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body; // Expecting { "action": "ACCEPTED" } or "REJECTED"
    const currentUserId = toStr(req.user.id);

    // A. Validate Action
    if (!['ACCEPTED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use ACCEPTED or REJECTED." });
    }

    // B. Find the Connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection request not found." });
    }

    // C. SECURITY: Ensure ONLY the Receiver can accept/reject
    if (toStr(connection.receiverId) !== currentUserId) {
      return res.status(403).json({ message: "You are not authorized to respond to this request." });
    }

    // D. Check status
    if (connection.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${connection.status.toLowerCase()}` });
    }

    // E. Update Status
    connection.status = action;
    connection.respondedAt = new Date();
    await connection.save();

    // Notify requester if accepted
    try {
      if (action === 'ACCEPTED') {
        await notificationService.createNotification(
          { id: connection.requesterId, type: 'User' },
          { id: connection.receiverId, type: 'User' },
          'connection_accepted',
          { id: connection._id, type: 'Post' }
        );
      }
    } catch (err) {
      console.error('Error creating connection accepted notification:', err);
    }

    res.json({ message: `Connection request ${action.toLowerCase()}.`, connection });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// --- 3. Get My Pending Requests (Inbox) ---
exports.getPendingRequests = async (req, res) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.user.id);
    const requests = await Connection.find({
      receiverId: myId,
      status: 'PENDING'
    }).lean();

    // Manually populate requester details
    const normalized = await Promise.all(
      requests.map(async (r) => {
        let requester = null;
        try {
          const user = await User.findById(r.requesterId).select('firstName lastName image location');
          requester = user ? {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            location: user.location
          } : { _id: r.requesterId };
        } catch (e) {
          console.error('Error populating requester:', e);
          requester = { _id: r.requesterId };
        }
        return {
          _id: r._id,
          status: r.status,
          createdAt: r.createdAt,
          requester: requester,
          receiverId: r.receiverId
        };
      })
    );

    res.json(normalized);
  } catch (error) {
    console.error('getPendingRequests error:', error);
    res.status(500).json({ message: error.message });
  }
};

// --- 4. Get My Connected Users (Friends List) ---
exports.getMyConnections = async (req, res) => {
  try {
    // 🔑 FORCE STRING — this is the key
    const userId = req.user.id.toString();

    console.log('AUTH USER ID (STRING):', userId);

    const connections = await Connection.find({
      status: 'ACCEPTED',
      $or: [
        { requesterId: userId },
        { receiverId: userId }
      ]
    }).lean();

    console.log('FOUND CONNECTIONS:', connections);

    const friends = await Promise.all(
      connections.map(async (conn) => {
        // compare as strings to avoid ObjectId vs string issues
        const isRequester = toStr(conn.requesterId) === userId;
        const otherUserId = isRequester ? conn.receiverId : conn.requesterId;
        
        // Convert to string for User.findById (works with both string and ObjectId)
        const otherUserIdStr = otherUserId.toString();

        console.log('Resolving friend id:', otherUserIdStr);

        const user = await User.findById(otherUserIdStr).select('firstName lastName image');

        if (!user) {
          console.log('User not found for id:', otherUserIdStr);
          return null;
        }

        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image
        };
      })
    );

    // Filter out null values
    const filteredFriends = friends.filter(friend => friend !== null);
    
    console.log('Final friends list:', filteredFriends);

    // Remove caching headers - they might be causing issues
    res.status(200).json(filteredFriends);
  } catch (error) {
    console.error('getMyConnections error:', error);
    res.status(500).json({ message: error.message });
  }
};

// --- Check Connection Status (for Profile View) ---
exports.checkConnectionStatus = async (req, res) => {
  try {
    const currentUserId = toStr(req.user.id);
    const targetUserId = req.params.userId;

    if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required" });
    }

    // Check for existing connection in EITHER direction
    const connection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, receiverId: targetUserId },
        { requesterId: targetUserId, receiverId: currentUserId }
      ]
    });

    // Case 1: No connection exists at all
    if (!connection) {
      return res.json({ 
        status: 'NONE', 
        isRequester: false,
        connectionId: null 
      });
    }

    // Case 2: Connection found
    // 'isRequester' helps the UI decide whether to show "Request Sent" vs "Accept/Reject"
    const isRequester = toStr(connection.requesterId) === currentUserId;

    return res.json({
      status: connection.status, // 'PENDING', 'ACCEPTED', 'REJECTED'
      isRequester: isRequester,
      connectionId: connection._id,
      requesterId: connection.requesterId,
      receiverId: connection.receiverId
    });

  } catch (error) {
    console.error('checkConnectionStatus error:', error);
    res.status(500).json({ message: error.message });
  }
};

// --- Disconnect / Remove Any Connection ---
exports.disconnect = async (req, res) => {
  try {
    const currentUserId = toStr(req.user.id);
    const targetUserId = req.params.userId;

    // Remove the connection record regardless of its status (PENDING, ACCEPTED, REJECTED)
    // This handles Unfriending, Canceling sent requests, and Rejecting received requests.
    const conn = await Connection.findOneAndDelete({
      $or: [
        { requesterId: currentUserId, receiverId: targetUserId },
        { requesterId: targetUserId, receiverId: currentUserId }
      ]
    });

    if (!conn) {
      return res.status(404).json({ message: 'No connection found between these users.' });
    }

    // Clean up any associated notifications to avoid dead links
    try {
        await notificationService.deleteNotification({
            recipient: targetUserId,
            sender: currentUserId,
            type: 'connection_request'
        });
        await notificationService.deleteNotification({
            recipient: currentUserId,
            sender: targetUserId,
            type: 'connection_request'
        });
    } catch (err) {
        console.warn('Notification cleanup failed (non-fatal):', err.message);
    }

    return res.json({ message: 'Connection removed successfully', connection: conn });
  } catch (err) {
    console.error('disconnect error:', err);
    return res.status(500).json({ message: err.message });
  }
};