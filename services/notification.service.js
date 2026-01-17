const Notification = require('../models/Notification.model');

/**
 * @param {Object} receiver - { id, type } ('User' or 'Company')
 * @param {Object} sender - { id, type } ('User' or 'Company')
 * @param {String} type - 'reaction', 'comment', etc.
 * @param {Object} entity - { id, type } ('Post', 'Comment', 'JobOffer')
 */
exports.createNotification = async (receiver, sender, type, entity) => {
  try {
    
    if (receiver.id.toString() === sender.id.toString()) return;

    return await Notification.create({
      receiver,
      sender,
      type,
      entity
    });
  } catch (error) {
    console.error("Notification Creation Error:", error);
  }
};

exports.getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return await Notification.find({ 'receiver.id': userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender.id') 
    .populate('entity.id'); 
};

exports.getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ 'receiver.id': userId, isRead: false });
};

exports.markAllAsRead = async (userId) => {
  const res = await Notification.updateMany({ 'receiver.id': userId, isRead: false }, { isRead: true });
  return res.nModified || res.modifiedCount || 0;
};

exports.markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, 'receiver.id': userId },
    { isRead: true },
    { new: true }
  );
};