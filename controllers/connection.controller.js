const Connection = require('../models/Connection.model');
const User = require('../models/User.model');
const mongoose = require('mongoose');
const toStr = v => (v && v.toString ? v.toString() : v);
const notificationService = require('../services/notification.service');


exports.sendConnectionRequest = async (req, res) => {
  try {
    const requesterId = toStr(req.user.id);  
    const receiverId = req.params.userId; 
    if (requesterId === toStr(receiverId)) {
      return res.status(400).json({ message: "You cannot connect with yourself." });
    }
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ message: "User not found." });
    }
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId: requesterId, receiverId: receiverId },
        { requesterId: receiverId, receiverId: requesterId }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'PENDING') {
        if (toStr(existingConnection.requesterId) === receiverId) {
          return res.status(400).json({ message: "The user has already sent you a request. Please accept or reject it." });
        }
        return res.status(400).json({ message: "Connection request already pending." });
      }
      if (existingConnection.status === 'ACCEPTED') {
        return res.status(400).json({ message: "You are already connected." });
      }
      return res.status(400).json({ message: "Connection request was previously rejected." });
    }
    const newConnection = await Connection.create({
      requesterId,
      receiverId,
      status: 'PENDING'
    });
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
exports.respondToRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body; 
    const currentUserId = toStr(req.user.id);
    if (!['ACCEPTED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use ACCEPTED or REJECTED." });
    }
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection request not found." });
    }
    if (toStr(connection.receiverId) !== currentUserId) {
      return res.status(403).json({ message: "You are not authorized to respond to this request." });
    }
    if (connection.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${connection.status.toLowerCase()}` });
    }
    connection.status = action;
    connection.respondedAt = new Date();
    await connection.save();
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

exports.getPendingRequests = async (req, res) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.user.id);
    const requests = await Connection.find({
      receiverId: myId,
      status: 'PENDING'
    }).lean();

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

exports.getMyConnections = async (req, res) => {
  try {
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
        const isRequester = toStr(conn.requesterId) === userId;
        const otherUserId = isRequester ? conn.receiverId : conn.requesterId;
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
    const filteredFriends = friends.filter(friend => friend !== null);
    
    console.log('Final friends list:', filteredFriends);
    res.status(200).json(filteredFriends);
  } catch (error) {
    console.error('getMyConnections error:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.checkConnectionStatus = async (req, res) => {
  try {
    const currentUserId = toStr(req.user.id);
    const targetUserId = req.params.userId;

    if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required" });
    }
    const connection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, receiverId: targetUserId },
        { requesterId: targetUserId, receiverId: currentUserId }
      ]
    });
    if (!connection) {
      return res.json({ 
        status: 'NONE', 
        isRequester: false,
        connectionId: null 
      });
    }
    const isRequester = toStr(connection.requesterId) === currentUserId;

    return res.json({
      status: connection.status,
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
exports.disconnect = async (req, res) => {
  try {
    const currentUserId = toStr(req.user.id);
    const targetUserId = req.params.userId;
    const conn = await Connection.findOneAndDelete({
      $or: [
        { requesterId: currentUserId, receiverId: targetUserId },
        { requesterId: targetUserId, receiverId: currentUserId }
      ]
    });

    if (!conn) {
      return res.status(404).json({ message: 'No connection found between these users.' });
    }
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